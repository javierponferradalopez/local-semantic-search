import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
import type {ApiError} from 'contract/ApiError';
import {CONTENT_TYPES} from 'contract/ContentType';
import type {SearchResponse} from 'contract/SearchResponse';
import type {TextResult} from 'contract/TextResult';
import {useTheTestApi} from '../../../../lib/testApi';

const OK = 200;
const BAD_REQUEST = 400;

const FIELDS_OF_A_TEXT_RESULT = ['contentType', 'fileUrl', 'name', 'resourceId', 'text'];

const fixture = (name: string): Promise<Buffer> =>
  readFile(join(import.meta.dirname, '../../../../fixtures', name));

describe('GET /search', () => {
  const api = useTheTestApi();

  const createAReadyResource = async (name: string, content: Buffer): Promise<void> => {
    const {id} = await api.createATextResourceRow(name, content);

    expect((await api.rowOnceIngested(id)).ingestState).toBe('ready');
  };

  it('should give one text Result for each Ready Resource, and no image', async () => {
    await createAReadyResource(
      'the lighthouse.md',
      await fixture('markdown-with-headings.md')
    );
    await createAReadyResource('the pages.pdf', await fixture('two-pages-with-text.pdf'));

    const response = await api.search('the lighthouse on the coast');

    expect(response.status).toBe(OK);

    const body = (await response.json()) as SearchResponse;

    expect(Object.keys(body).toSorted()).toStrictEqual(['images', 'text']);
    expect(body.images).toStrictEqual([]);
    expect(body.text.map(result => result.name).toSorted()).toStrictEqual([
      'the lighthouse.md',
      'the pages.pdf'
    ]);

    for (const result of body.text) {
      expectATextResult(result);
    }
  });

  it('should give a page to a Content type with pages, and no page key to the others', async () => {
    await createAReadyResource(
      'the lighthouse.md',
      await fixture('markdown-with-headings.md')
    );
    await createAReadyResource('the pages.pdf', await fixture('two-pages-with-text.pdf'));

    const {text} = (await (await api.search('the lighthouse')).json()) as SearchResponse;
    const pdf = text.find(result => result.contentType === 'pdf');
    const markdown = text.find(result => result.contentType === 'markdown');

    expect(Number.isInteger(pdf?.page)).toBe(true);
    expect(markdown).not.toHaveProperty('page');
  });

  it('should give no text Result when no Resource is stored', async () => {
    const response = await api.search('the lighthouse');

    expect(response.status).toBe(OK);
    expect(await response.json()).toStrictEqual({text: [], images: []});
  });

  it.each([
    ['holds only spaces', '/search?q=%20%20'],
    ['is empty', '/search?q='],
    ['is missing', '/search']
  ])('should give 400 and invalid_input for a Query that %s', async (_, path) => {
    const response = await fetch(`${api.origin()}${path}`);

    expect(response.status).toBe(BAD_REQUEST);
    expect(await response.json()).toStrictEqual({
      errors: [{code: 'invalid_input', params: {path: 'q'}}]
    } satisfies ApiError);
  });

  const expectATextResult = (value: unknown): void => {
    const result = value as TextResult;
    const fields = Object.keys(result).toSorted();

    expect(typeof result.resourceId).toBe('string');
    expect(typeof result.name).toBe('string');
    expect(typeof result.text).toBe('string');
    expect(typeof result.fileUrl).toBe('string');
    expect(CONTENT_TYPES).toContain(result.contentType);

    if (result.contentType === 'pdf') {
      expect(Number.isInteger(result.page)).toBe(true);
      expect(fields).toStrictEqual([...FIELDS_OF_A_TEXT_RESULT, 'page'].toSorted());

      return;
    }

    expect(fields).toStrictEqual(FIELDS_OF_A_TEXT_RESULT.toSorted());
  };
});
