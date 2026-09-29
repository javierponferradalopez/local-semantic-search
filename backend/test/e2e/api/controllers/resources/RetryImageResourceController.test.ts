import {randomUUID} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
import type {ApiError} from 'contract/ApiError';
import type {ResourceRow} from 'contract/ResourceRow';
import {container} from '../../../../../src/api/config/di/Container';
import type {ImageResource} from '../../../../../src/core/resources/domain/ImageResource';
import type {TextResource} from '../../../../../src/core/resources/domain/TextResource';
import {DrizzleResourceRepository} from '../../../../../src/core/resources/infrastructure/drizzle/DrizzleResourceRepository';
import {FilesystemFileStore} from '../../../../../src/core/shared/infrastructure/FilesystemFileStore';
import {useTheTestApi} from '../../../../lib/testApi';
import {ImageResourceBuilder} from '../../../../utils/builders/image-resource/ImageResourceBuilder';
import {TextResourceBuilder} from '../../../../utils/builders/text-resource/TextResourceBuilder';

const OK = 200;
const BAD_REQUEST = 400;
const NOT_FOUND = 404;
const CONFLICT = 409;

const FIXTURES = join(import.meta.dirname, '../../../../fixtures');

describe('POST /resources/images/:id/retry', () => {
  const api = useTheTestApi();

  it('should give 200 and the row of the Resource back in Ingesting, with no Reason', async () => {
    const failed = await storeAFailedImageResource();

    const response = await api.retryImageResource(failed.id.value);

    expect(response.status).toBe(OK);

    const row = (await response.json()) as ResourceRow;

    expect(row).toMatchObject({id: failed.id.value, ingestState: 'ingesting'});
    expect(row).not.toHaveProperty('reason');
    // So the Ingest of the Retry does not run into the next test.
    await api.rowOnceIngested(failed.id.value);
  });

  it('should make a Failed Resource whose File holds a picture Ready', async () => {
    const failed = await storeAFailedImageResource();

    await api.retryImageResource(failed.id.value);
    const row = await api.rowOnceIngested(failed.id.value);

    expect(row.ingestState).toBe('ready');
    expect(row).not.toHaveProperty('reason');
  });

  it('should give 409 and resource_not_failed for a Resource that is not Failed', async () => {
    const ingesting = ImageResourceBuilder.anImageResource().build();
    await container.getDependency(DrizzleResourceRepository).create(ingesting);

    const response = await api.retryImageResource(ingesting.id.value);

    expect(response.status).toBe(CONFLICT);
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

    const response = await api.retryImageResource(resourceId);

    expect(response.status).toBe(NOT_FOUND);
    expect(await response.json()).toStrictEqual({
      errors: [{code: 'resource_not_found', params: {resourceId}}]
    } satisfies ApiError);
  });

  it('should give 404 and resource_not_found for an identifier that a Text Resource holds', async () => {
    const failed = await storeAFailedTextResource();

    const response = await api.retryImageResource(failed.id.value);

    expect(response.status).toBe(NOT_FOUND);
    expect(await response.json()).toStrictEqual({
      errors: [{code: 'resource_not_found', params: {resourceId: failed.id.value}}]
    } satisfies ApiError);
  });

  it('should give 400 and invalid_input for an identifier that is not a UUID', async () => {
    const response = await api.retryImageResource('not-a-uuid');

    expect(response.status).toBe(BAD_REQUEST);
    expect(await response.json()).toStrictEqual({
      errors: [{code: 'invalid_input', params: {path: 'id'}}]
    } satisfies ApiError);
  });

  // Written straight to the store, with a File that holds a picture, so the Ingest of the Retry gives no Reason.
  const storeAFailedImageResource = async (): Promise<ImageResource> => {
    const imageResource = ImageResourceBuilder.anImageResource()
      .withIngestState('failed')
      .withReason('image_too_large')
      .build();

    await container
      .getDependency(FilesystemFileStore)
      .store(
        imageResource.fileKey,
        await readFile(join(FIXTURES, 'a-small-picture.png'))
      );
    await container.getDependency(DrizzleResourceRepository).create(imageResource);

    return imageResource;
  };

  const storeAFailedTextResource = async (): Promise<TextResource> => {
    const textResource = TextResourceBuilder.aTextResource()
      .withIngestState('failed')
      .withReason('ingest_error')
      .build();

    await container.getDependency(DrizzleResourceRepository).create(textResource);

    return textResource;
  };
});
