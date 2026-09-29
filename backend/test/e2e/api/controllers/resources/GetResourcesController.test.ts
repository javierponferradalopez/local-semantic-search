import {CONTENT_TYPES} from 'contract/ContentType';
import {INGEST_STATES} from 'contract/IngestState';
import {REASON_CODES} from 'contract/ReasonCode';
import type {ResourceRow} from 'contract/ResourceRow';
import {container} from '../../../../../src/api/config/di/Container';
import {DrizzleResourceRepository} from '../../../../../src/core/resources/infrastructure/drizzle/DrizzleResourceRepository';
import {useTheTestApi} from '../../../../lib/testApi';
import {TextResourceBuilder} from '../../../../utils/builders/text-resource/TextResourceBuilder';

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

  it('should give the images and the texts in one list, newest first', async () => {
    await api.createTextResource('the oldest.md', 'the oldest');
    await api.createImageResource('the middle.png', 'the middle');
    await api.createTextResource('the newer.txt', 'the newer');
    await api.createImageResource('the newest.svg', 'the newest');

    expect(
      (await api.getResources()).map(({name, contentType}) => ({name, contentType}))
    ).toStrictEqual([
      {name: 'the newest.svg', contentType: 'svg'},
      {name: 'the newer.txt', contentType: 'plain_text'},
      {name: 'the middle.png', contentType: 'png'},
      {name: 'the oldest.md', contentType: 'markdown'}
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

  it('should give the reason of a Failed row, and no reason on the other rows', async () => {
    await api.createTextResource('the notes.md', 'the notes');
    await container
      .getDependency(DrizzleResourceRepository)
      .create(
        TextResourceBuilder.aTextResource()
          .withIngestState('failed')
          .withReason('no_text_found')
          .build()
      );

    const rows = await api.getResources();

    expect(rows.map(({ingestState, reason}) => ({ingestState, reason}))).toStrictEqual(
      expect.arrayContaining([
        {ingestState: 'ingesting', reason: undefined},
        {ingestState: 'failed', reason: 'no_text_found'}
      ])
    );

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
