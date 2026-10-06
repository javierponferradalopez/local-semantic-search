import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
import type {ApiError} from 'contract/ApiError';
import {CONTENT_TYPES} from 'contract/ContentType';
import type {ImageResult} from 'contract/ImageResult';
import type {SearchResponse} from 'contract/SearchResponse';
import type {TextResult} from 'contract/TextResult';
import {useTheTestApi} from '../../../../lib/testApi';

const OK = 200;
const BAD_REQUEST = 400;

const FIELDS_OF_A_TEXT_RESULT = ['contentType', 'fileUrl', 'name', 'resourceId', 'text'];
const FIELDS_OF_AN_IMAGE_RESULT = ['fileUrl', 'name', 'resourceId', 'thumbnailUrl'];

// The text of page one of two-pages-with-text.pdf, so that the Margin keeps the two Resources.
const THE_TEXT_OF_THE_PDF = Buffer.from(
  'Page one of the fixture.\nAn extractor reads this text.\n'
);
const THE_QUERY_OF_THE_PDF = 'an extractor reads this text';

const fixture = (name: string): Promise<Buffer> =>
  readFile(join(import.meta.dirname, '../../../../fixtures', name));

describe('GET /search', () => {
  const api = useTheTestApi();

  const createAReadyResource = async (name: string, content: Buffer): Promise<void> => {
    const {id} = await api.createATextResourceRow(name, content);

    expect((await api.rowOnceIngested(id)).ingestState).toBe('ready');
  };

  const createAReadyImageResource = async (name: string): Promise<string> => {
    const {id} = await api.createAnImageResourceRow(name, await fixture(name));

    expect((await api.rowOnceIngested(id)).ingestState).toBe('ready');

    return id;
  };

  it('should give one text Result for each Ready Resource, and no image', async () => {
    await createAReadyResource('the fixture.md', THE_TEXT_OF_THE_PDF);
    await createAReadyResource('the pages.pdf', await fixture('two-pages-with-text.pdf'));

    const response = await api.search(THE_QUERY_OF_THE_PDF);

    expect(response.status).toBe(OK);

    const body = (await response.json()) as SearchResponse;

    expect(Object.keys(body).toSorted()).toStrictEqual(['images', 'text']);
    expect(body.images).toStrictEqual([]);
    expect(body.text.map(result => result.name).toSorted()).toStrictEqual([
      'the fixture.md',
      'the pages.pdf'
    ]);

    for (const result of body.text) {
      expectATextResult(result);
    }
  });

  it('should give a page to a Content type with pages, and no page key to the others', async () => {
    await createAReadyResource('the fixture.md', THE_TEXT_OF_THE_PDF);
    await createAReadyResource('the pages.pdf', await fixture('two-pages-with-text.pdf'));

    const {text} = (await (
      await api.search(THE_QUERY_OF_THE_PDF)
    ).json()) as SearchResponse;
    const pdf = text.find(result => result.contentType === 'pdf');
    const markdown = text.find(result => result.contentType === 'markdown');

    expect(Number.isInteger(pdf?.page)).toBe(true);
    expect(markdown).not.toHaveProperty('page');
  });

  it('should give one image Result for a Ready Image Resource, next to the text Results', async () => {
    await createAReadyResource(
      'the lighthouse.md',
      await fixture('markdown-with-headings.md')
    );
    const id = await createAReadyImageResource('a-small-picture.png');

    const response = await api.search('a beach under the sun');

    expect(response.status).toBe(OK);

    const body = (await response.json()) as SearchResponse;

    expect(body.images.map(result => result.resourceId)).toStrictEqual([id]);
    expect(body.images[0]?.name).toBe('a-small-picture.png');

    for (const result of body.text) {
      expectATextResult(result);
    }

    for (const result of body.images) {
      expectAnImageResult(result);
    }
  });

  it('should give a thumbnailUrl that resolves to the bytes of a WebP', async () => {
    await createAReadyImageResource('a-small-picture.png');

    const {images} = (await (
      await api.search('a beach under the sun')
    ).json()) as SearchResponse;
    const thumbnail = await fetch(`${api.origin()}${images[0]?.thumbnailUrl}`);

    expect(thumbnail.status).toBe(OK);
    expect(thumbnail.headers.get('content-type')).toBe('image/webp');
    expect((await thumbnail.arrayBuffer()).byteLength).toBeGreaterThan(0);
  });

  it('should give a fileUrl that resolves to the File of the Image Resource', async () => {
    await createAReadyImageResource('a-small-picture.png');

    const {images} = (await (
      await api.search('a beach under the sun')
    ).json()) as SearchResponse;
    const file = await fetch(`${api.origin()}${images[0]?.fileUrl}`);

    expect(Buffer.from(await file.arrayBuffer())).toStrictEqual(
      await fixture('a-small-picture.png')
    );
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
    expect(result).not.toHaveProperty('thumbnailUrl');
  };

  const expectAnImageResult = (value: unknown): void => {
    const result = value as ImageResult;

    expect(typeof result.resourceId).toBe('string');
    expect(typeof result.name).toBe('string');
    expect(typeof result.fileUrl).toBe('string');
    expect(typeof result.thumbnailUrl).toBe('string');
    expect(Object.keys(result).toSorted()).toStrictEqual(
      FIELDS_OF_AN_IMAGE_RESULT.toSorted()
    );
  };
});
