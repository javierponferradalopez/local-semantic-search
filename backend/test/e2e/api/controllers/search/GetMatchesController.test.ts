import {randomUUID} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
import type {ApiError} from 'contract/ApiError';
import type {GetMatchesResponse} from 'contract/GetMatchesResponse';
import type {MatchRow} from 'contract/MatchRow';
import type {ResourceRow} from 'contract/ResourceRow';
import type {SearchResponse} from 'contract/SearchResponse';
import {MATCHES_LIMIT} from '../../../../../src/api/config/MatchesLimit';
import {useTheTestApi} from '../../../../lib/testApi';

const OK = 200;
const BAD_REQUEST = 400;
const NOT_FOUND = 404;

const fixture = (name: string): Promise<Buffer> =>
  readFile(join(import.meta.dirname, '../../../../fixtures', name));

describe('GET /resources/texts/:id/matches', () => {
  const api = useTheTestApi();

  const createAReadyResource = async (
    name: string,
    content: Buffer
  ): Promise<ResourceRow> => {
    const row = await api.createATextResourceRow(name, content);

    expect((await api.rowOnceIngested(row.id)).ingestState).toBe('ready');

    return row;
  };

  const matchesOf = async (id: string, query: string): Promise<GetMatchesResponse> => {
    const response = await api.matches(id, query);

    expect(response.status).toBe(OK);

    return (await response.json()) as GetMatchesResponse;
  };

  it('should give the best Match first, the one that the Search shows', async () => {
    const {id} = await createAReadyResource(
      'the lighthouse.md',
      await fixture('markdown-with-headings.md')
    );
    const query = 'how far the beam of the lamp reaches';

    const {text} = (await (await api.search(query)).json()) as SearchResponse;
    const rows = await matchesOf(id, query);

    expect(rows.length).toBeGreaterThan(1);
    expect(rows.length).toBeLessThanOrEqual(MATCHES_LIMIT);
    expect(rows[0]?.text).toBe(text[0]?.text);
  });

  it.each([
    ['the lighthouse.md', 'markdown-with-headings.md'],
    ['the salt pans.txt', 'long-text.txt']
  ])(
    'should give no Match of %s when no Match of it reaches the Floor',
    async (name, fixtureName) => {
      const {id} = await createAReadyResource(name, await fixture(fixtureName));
      const query = 'receta de tortilla de patatas';

      const {text} = (await (await api.search(query)).json()) as SearchResponse;
      const rows = await matchesOf(id, query);

      expect(text).toStrictEqual([]);
      expect(rows).toStrictEqual([]);
    }
  );

  it('should give a page to a Content type with pages, and no page key to the others', async () => {
    const markdown = await createAReadyResource(
      'the lighthouse.md',
      await fixture('markdown-with-headings.md')
    );
    const pdf = await createAReadyResource(
      'the pages.pdf',
      await fixture('two-pages-with-text.pdf')
    );

    const markdownRows = await matchesOf(markdown.id, 'the lighthouse');
    const pdfRows = await matchesOf(pdf.id, 'an extractor reads this text');

    expect(markdownRows.length).toBeGreaterThan(0);
    expect(pdfRows.length).toBeGreaterThan(0);

    for (const row of markdownRows) {
      expectAMatchRow(row, false);
    }

    for (const row of pdfRows) {
      expectAMatchRow(row, true);
    }
  });

  it('should give 404 and resource_not_found for an identifier that no Resource holds', async () => {
    const resourceId = randomUUID();

    const response = await api.matches(resourceId, 'the lighthouse');

    expect(response.status).toBe(NOT_FOUND);
    expect(await response.json()).toStrictEqual({
      errors: [{code: 'resource_not_found', params: {resourceId}}]
    } satisfies ApiError);
  });

  it('should give 404 and resource_not_found for an identifier that an Image Resource holds', async () => {
    const {id} = await api.createAnImageResourceRow(
      'a small picture.png',
      await fixture('a-small-picture.png')
    );

    const response = await api.matches(id, 'the lighthouse');

    expect(response.status).toBe(NOT_FOUND);
    expect(await response.json()).toStrictEqual({
      errors: [{code: 'resource_not_found', params: {resourceId: id}}]
    } satisfies ApiError);
  });

  it.each([
    ['holds only spaces', '?q=%20%20'],
    ['is empty', '?q='],
    ['is missing', '']
  ])('should give 400 and invalid_input for a Query that %s', async (_, search) => {
    const response = await api.fetch(`/resources/texts/${randomUUID()}/matches${search}`);

    expect(response.status).toBe(BAD_REQUEST);
    expect(await response.json()).toStrictEqual({
      errors: [{code: 'invalid_input', params: {path: 'q'}}]
    } satisfies ApiError);
  });

  it('should give 400 and invalid_input for an identifier that is not a UUID', async () => {
    const response = await api.matches('not-a-uuid', 'the lighthouse');

    expect(response.status).toBe(BAD_REQUEST);
    expect(await response.json()).toStrictEqual({
      errors: [{code: 'invalid_input', params: {path: 'id'}}]
    } satisfies ApiError);
  });

  const expectAMatchRow = (value: unknown, hasPages: boolean): void => {
    const row = value as MatchRow;

    expect(typeof row.text).toBe('string');

    if (hasPages) {
      expect(Number.isInteger(row.page)).toBe(true);
      expect(Object.keys(row).toSorted()).toStrictEqual(['page', 'text']);

      return;
    }

    expect(Object.keys(row)).toStrictEqual(['text']);
  };
});
