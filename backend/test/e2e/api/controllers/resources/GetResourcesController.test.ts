import {CONTENT_TYPES} from 'contract/ContentType';
import {INGEST_STATES} from 'contract/IngestState';
import {REASON_CODES} from 'contract/ReasonCode';
import type {ResourceRow} from 'contract/ResourceRow';
import {useTheTestApi} from '../../../../lib/testApi';

const OK = 200;

const FIELDS_OF_A_ROW = [
  'contentType',
  'createdAt',
  'fileUrl',
  'id',
  'ingestState',
  'name'
];

describe('GET /resources', () => {
  const api = useTheTestApi();

  it('should give the whole list, newest first', async () => {
    await api.createTextResource('the oldest.md', 'the oldest');
    await api.createTextResource('the middle.txt', 'the middle');
    await api.createTextResource('the newest.pdf', 'the newest');

    expect((await api.getResources()).map(row => row.name)).toStrictEqual([
      'the newest.pdf',
      'the middle.txt',
      'the oldest.md'
    ]);
  });

  it('should give nothing when no Resource is stored', async () => {
    expect(await api.getResources()).toStrictEqual([]);
  });

  it('should give rows that obey the types that contract/ declares', async () => {
    await api.createTextResource('the notes.md', 'the notes');

    const response = await fetch(`${api.origin()}/resources`);

    expect(response.status).toBe(OK);

    const rows = (await response.json()) as unknown[];

    expect(rows).toHaveLength(1);

    for (const row of rows) {
      expectAResourceRow(row);
    }
  });

  const expectAResourceRow = (value: unknown): void => {
    const row = value as ResourceRow;
    const fields = Object.keys(row).toSorted();

    expect(typeof row.id).toBe('string');
    expect(typeof row.name).toBe('string');
    expect(typeof row.fileUrl).toBe('string');
    expect(CONTENT_TYPES).toContain(row.contentType);
    expect(INGEST_STATES).toContain(row.ingestState);
    expect(new Date(row.createdAt).toISOString()).toBe(row.createdAt);

    if (row.ingestState === 'failed') {
      expect(REASON_CODES).toContain(row.reason);
      expect(fields).toStrictEqual([...FIELDS_OF_A_ROW, 'reason'].toSorted());

      return;
    }

    expect(fields).toStrictEqual(FIELDS_OF_A_ROW.toSorted());
  };
});
