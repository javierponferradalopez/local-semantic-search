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
import {countTheChunksAndVectorsOf} from '../../../../lib/testInfrastructure';

const OK = 200;
const BAD_REQUEST = 400;

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
    'should give every Match of %s, ten at most, with no Floor',
    async (name, fixtureName) => {
      const {id} = await createAReadyResource(name, await fixture(fixtureName));
      const {chunks} = await countTheChunksAndVectorsOf(id);
      const query = 'receta de tortilla de patatas';

      const {text} = (await (await api.search(query)).json()) as SearchResponse;
      const rows = await matchesOf(id, query);

      expect(text).toStrictEqual([]);
      expect(rows).toHaveLength(Math.min(chunks, MATCHES_LIMIT));
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

    for (const row of await matchesOf(markdown.id, 'the lighthouse')) {
      expectAMatchRow(row, false);
    }

    for (const row of await matchesOf(pdf.id, 'the lighthouse')) {
      expectAMatchRow(row, true);
    }
  });

  it('should give no Match for an identifier that no Resource holds', async () => {
    expect(await matchesOf(randomUUID(), 'the lighthouse')).toStrictEqual([]);
  });

  it.each([
    ['holds only spaces', '?q=%20%20'],
    ['is empty', '?q='],
    ['is missing', '']
  ])('should give 400 and invalid_input for a Query that %s', async (_, search) => {
    const response = await fetch(
      `${api.origin()}/resources/texts/${randomUUID()}/matches${search}`
    );

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
