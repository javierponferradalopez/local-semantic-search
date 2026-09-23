import type {Server} from 'node:http';
import type {AddressInfo} from 'node:net';
import type {ApiError} from 'contract/ApiError';
import {CONTENT_TYPES} from 'contract/ContentType';
import {CreateTextResourceRequest} from 'contract/CreateTextResourceRequest';
import {INGEST_STATES} from 'contract/IngestState';
import {REASON_CODES} from 'contract/ReasonCode';
import type {ResourceRow} from 'contract/ResourceRow';
import {Pool} from 'pg';
import {createApp} from '../../src/api/app';
import {container} from '../../src/api/config/di/Container';
import {wipeTheData} from '../lib/testInfrastructure';

const CREATED = 201;
const OK = 200;
const CONFLICT = 409;

describe('the routes of a Resource', () => {
  let server: Server;
  let origin: string;

  beforeAll(() => {
    server = createApp().listen(0);
    origin = `http://localhost:${(server.address() as AddressInfo).port}`;
  });

  afterAll(async () => {
    server.close();
    await container.getDependency(Pool).end();
  });

  beforeEach(wipeTheData);

  describe('POST /resources/texts', () => {
    it('should give 201 and the row of the Resource in Ingesting', async () => {
      const response = await createTextResource('the notes.md', 'the notes');

      expect(response.status).toBe(CREATED);

      const row = (await response.json()) as ResourceRow;

      expect(row.name).toBe('the notes.md');
      expect(row.contentType).toBe('markdown');
      expect(row.ingestState).toBe('ingesting');
    });

    it('should give 409 and duplicate_resource for the same bytes', async () => {
      const created = (await (
        await createTextResource('the notes.md', 'the same')
      ).json()) as ResourceRow;

      const response = await createTextResource('another name.md', 'the same');

      expect(response.status).toBe(CONFLICT);
      expect(response.headers.get('content-type')).toContain('application/json');
      expect(await response.json()).toStrictEqual({
        errors: [
          {
            code: 'duplicate_resource',
            params: {
              resourceId: created.id,
              name: 'the notes.md',
              ingestState: 'ingesting'
            }
          }
        ]
      } satisfies ApiError);
    });

    it('should leave one Resource alone when the same bytes arrive twice', async () => {
      await createTextResource('the notes.md', 'the same');
      await createTextResource('another name.md', 'the same');

      expect(await getResources()).toHaveLength(1);
    });

    it('should take a file with the same name and different bytes', async () => {
      await createTextResource('the notes.md', 'the first');
      const response = await createTextResource('the notes.md', 'the second');

      expect(response.status).toBe(CREATED);
      expect(await getResources()).toHaveLength(2);
    });
  });

  describe('GET /resources', () => {
    it('should give the whole list, newest first', async () => {
      await createTextResource('the oldest.md', 'the oldest');
      await createTextResource('the middle.txt', 'the middle');
      await createTextResource('the newest.pdf', 'the newest');

      expect((await getResources()).map(row => row.name)).toStrictEqual([
        'the newest.pdf',
        'the middle.txt',
        'the oldest.md'
      ]);
    });

    it('should give nothing when no Resource is stored', async () => {
      expect(await getResources()).toStrictEqual([]);
    });
  });

  describe('the shape of every response', () => {
    it('should obey the types that contract/ declares', async () => {
      const response = await createTextResource('the notes.md', 'the notes');

      expect(response.status).toBe(CREATED);
      expectAResourceRow(await response.json());

      const listResponse = await fetch(`${origin}/resources`);

      expect(listResponse.status).toBe(OK);

      const rows = (await listResponse.json()) as unknown[];

      expect(rows).toHaveLength(1);

      for (const row of rows) {
        expectAResourceRow(row);
      }
    });
  });

  const createTextResource = (name: string, text: string): Promise<Response> => {
    const body = new FormData();

    body.append(CreateTextResourceRequest.filePart, new File([text], name));

    return fetch(`${origin}/resources/texts`, {method: 'POST', body});
  };

  const getResources = async (): Promise<ResourceRow[]> =>
    (await (await fetch(`${origin}/resources`)).json()) as ResourceRow[];
});

const FIELDS_OF_A_ROW = [
  'contentType',
  'createdAt',
  'fileUrl',
  'id',
  'ingestState',
  'name'
];

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
