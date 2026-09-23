import {randomUUID} from 'node:crypto';
import type {ApiError} from 'contract/ApiError';
import {CONTENT_TYPES} from 'contract/ContentType';
import {INGEST_STATES} from 'contract/IngestState';
import {REASON_CODES} from 'contract/ReasonCode';
import type {ResourceRow} from 'contract/ResourceRow';
import {container} from '../../../../../src/api/config/di/Container';
import type {TextResource} from '../../../../../src/core/resources/domain/TextResource';
import {DrizzleResourceRepository} from '../../../../../src/core/resources/infrastructure/drizzle/DrizzleResourceRepository';
import {useTheTestApi} from '../../../../lib/testApi';
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
  });

  it('should leave the Resource in Ingesting in the list', async () => {
    const failed = await storeAFailedTextResource();

    await api.retryTextResource(failed.id.value);

    const [row] = await api.getResources();

    expect(row?.id).toBe(failed.id.value);
    expect(row?.ingestState).toBe('ingesting');
    expect(row).not.toHaveProperty('reason');
  });

  it('should give 409 and resource_not_failed for a Resource that is not Failed', async () => {
    const created = await api.createATextResourceRow('the notes.md', 'the notes');

    const response = await api.retryTextResource(created.id);

    expect(response.status).toBe(CONFLICT);
    expect(response.headers.get('content-type')).toContain('application/json');
    expect(await response.json()).toStrictEqual({
      errors: [
        {
          code: 'resource_not_failed',
          params: {resourceId: created.id, ingestState: 'ingesting'}
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

  // No Resource reaches Failed over HTTP yet, so the row is written straight to the store.
  const storeAFailedTextResource = async (): Promise<TextResource> => {
    const textResource = TextResourceBuilder.aTextResource()
      .withIngestState('failed')
      .withReason('ingest_error')
      .build();

    await container.getDependency(DrizzleResourceRepository).save(textResource);

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
