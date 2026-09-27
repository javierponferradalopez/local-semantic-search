import {randomUUID} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
import type {ApiError} from 'contract/ApiError';
import {CONTENT_TYPES} from 'contract/ContentType';
import {INGEST_STATES} from 'contract/IngestState';
import {REASON_CODES} from 'contract/ReasonCode';
import type {ResourceRow} from 'contract/ResourceRow';
import {container} from '../../../../../src/api/config/di/Container';
import {TextResource} from '../../../../../src/core/resources/domain/TextResource';
import {ResourceId} from '../../../../../src/core/resources/domain/value-objects/ResourceId';
import {DrizzleResourceRepository} from '../../../../../src/core/resources/infrastructure/drizzle/DrizzleResourceRepository';
import {FilesystemFileStore} from '../../../../../src/core/shared/infrastructure/FilesystemFileStore';
import {useTheTestApi} from '../../../../lib/testApi';
import {testDatabase} from '../../../../lib/testInfrastructure';
import {TextResourceBuilder} from '../../../../utils/builders/text-resource/TextResourceBuilder';

const OK = 200;
const BAD_REQUEST = 400;
const NOT_FOUND = 404;
const CONFLICT = 409;

const FIELDS_OF_A_ROW = [
  'contentType',
  'createdAt',
  'fileUrl',
  'id',
  'ingestState',
  'name'
];

describe('POST /resources/texts/:id/retry', () => {
  const api = useTheTestApi();

  it('should give 200 and the row of the Resource back in Ingesting, with no Reason', async () => {
    const failed = await storeAFailedTextResource();

    const response = await api.retryTextResource(failed.id.value);

    expect(response.status).toBe(OK);

    const row = await response.json();

    expectAResourceRow(row);
    expect((row as ResourceRow).ingestState).toBe('ingesting');
    expect(row).not.toHaveProperty('reason');
    // So the Ingest of the Retry does not run into the next test.
    await api.rowOnceIngested(failed.id.value);
  });

  it('should leave the Resource in the list with no Reason', async () => {
    const failed = await storeAFailedTextResource();

    await api.retryTextResource(failed.id.value);

    const row = await api.rowOnceIngested(failed.id.value);

    expect(row?.id).toBe(failed.id.value);
    expect(row).not.toHaveProperty('reason');
  });

  it('should make a Failed Resource whose File holds text Ready, with one set of Chunks', async () => {
    const created = await api.createATextResourceRow(
      'long-text.txt',
      await readFile(join(import.meta.dirname, '../../../../fixtures/long-text.txt'))
    );
    await api.rowOnceIngested(created.id);
    const chunksOfTheFirstIngest = await countTheChunksAndVectorsOf(created.id);
    await markAsFailed(created.id);

    await api.retryTextResource(created.id);
    const row = await api.rowOnceIngested(created.id);

    expect(row.ingestState).toBe('ready');
    expect(chunksOfTheFirstIngest.chunks).toBeGreaterThan(0);
    expect(await countTheChunksAndVectorsOf(created.id)).toStrictEqual(
      chunksOfTheFirstIngest
    );
  });

  it('should give 409 and resource_not_failed for a Resource that is not Failed', async () => {
    const ingesting = await storeAnIngestingTextResource();

    const response = await api.retryTextResource(ingesting.id.value);

    expect(response.status).toBe(CONFLICT);
    expect(response.headers.get('content-type')).toContain('application/json');
    expect(await response.json()).toStrictEqual({
      errors: [
        {
          code: 'resource_not_failed',
          params: {resourceId: ingesting.id.value, ingestState: 'ingesting'}
        }
      ]
    } satisfies ApiError);
  });

  it('should give 404 and resource_not_found for an identifier that no Resource holds', async () => {
    const resourceId = randomUUID();

    const response = await api.retryTextResource(resourceId);

    expect(response.status).toBe(NOT_FOUND);
    expect(await response.json()).toStrictEqual({
      errors: [{code: 'resource_not_found', params: {resourceId}}]
    } satisfies ApiError);
  });

  it('should give 400 and invalid_input for an identifier that is not a UUID', async () => {
    const response = await api.retryTextResource('not-a-uuid');

    expect(response.status).toBe(BAD_REQUEST);
    expect(await response.json()).toStrictEqual({
      errors: [{code: 'invalid_input', params: {path: 'id'}}]
    } satisfies ApiError);
  });

  // The aggregate never makes a Ready Resource Failed, so the test writes the row and keeps its Chunks.
  const markAsFailed = async (id: string): Promise<void> => {
    const resourceRepository = container.getDependency(DrizzleResourceRepository);
    const ready = (await resourceRepository.find(
      ResourceId.of({value: id})
    )) as TextResource;

    await resourceRepository.update(
      TextResource.fromPrimitives({
        ...ready.toPrimitives(),
        ingestState: 'failed',
        reason: 'ingest_error'
      })
    );
  };

  // The API shows no Chunk, so the test reads the tables.
  const countTheChunksAndVectorsOf = async (
    resourceId: string
  ): Promise<{chunks: number; vectors: number}> => {
    const {rows} = await testDatabase().query<{chunks: number; vectors: number}>(
      `SELECT count(DISTINCT chunks.id)::int AS chunks, count(vectors_384.chunk_id)::int AS vectors
       FROM chunks LEFT JOIN vectors_384 ON vectors_384.chunk_id = chunks.id
       WHERE chunks.resource_id = $1`,
      [resourceId]
    );

    return rows[0] as {chunks: number; vectors: number};
  };

  // Written straight to the store, with a File that holds text, so the Ingest of the Retry gives no Reason.
  const storeAFailedTextResource = async (): Promise<TextResource> => {
    const textResource = TextResourceBuilder.aTextResource()
      .withIngestState('failed')
      .withReason('ingest_error')
      .build();

    await container
      .getDependency(FilesystemFileStore)
      .store(textResource.fileKey, Buffer.from('The notes of the owner.'));
    await container.getDependency(DrizzleResourceRepository).create(textResource);

    return textResource;
  };

  // Written straight to the store, so no event starts an Ingest and the row stays Ingesting.
  const storeAnIngestingTextResource = async (): Promise<TextResource> => {
    const textResource = TextResourceBuilder.aTextResource().build();

    await container.getDependency(DrizzleResourceRepository).create(textResource);

    return textResource;
  };

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
