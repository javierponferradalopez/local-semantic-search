import {randomUUID} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
import type {ApiError} from 'contract/ApiError';
import {useTheTestApi} from '../../../../lib/testApi';
import {testDatabase} from '../../../../lib/testInfrastructure';

const OK = 200;
const NO_CONTENT = 204;
const BAD_REQUEST = 400;
const NOT_FOUND = 404;

const DELETE_TIME_LIMIT_IN_MS = 5_000;
const READ_INTERVAL_IN_MS = 100;

describe('DELETE /resources/images/:id', () => {
  const api = useTheTestApi();

  it('should give 204, and leave no row and no File', async () => {
    const created = await api.createAnImageResourceRow('the beach.png', 'the beach');

    const response = await api.deleteImageResource(created.id);

    expect(response.status).toBe(NO_CONTENT);
    await api.expectNothingStored();
  });

  it('should leave no Picture, no Vector and no thumbnail of a Ready Resource', async () => {
    const created = await api.createAnImageResourceRow(
      'a-small-picture.png',
      await readFile(
        join(import.meta.dirname, '../../../../fixtures/a-small-picture.png')
      )
    );
    const row = await api.rowOnceIngested(created.id);
    const thumbnailUrl = `${api.origin()}/files/ingestion/thumbnails/${created.id}.webp`;
    const thumbnailOfTheIngest = await fetch(thumbnailUrl);
    const countsOfTheIngest = await countThePicturesAndVectors();

    await api.deleteImageResource(created.id);

    expect(row.ingestState).toBe('ready');
    expect(thumbnailOfTheIngest.status).toBe(OK);
    expect(countsOfTheIngest).toStrictEqual({pictures: 1, vectors: 1});
    expect(await statusOnceDeleted(thumbnailUrl)).toBe(NOT_FOUND);
    await api.expectNothingStored();
    // A Vector knows no Resource, and this Resource is the only one, so the whole tables must be empty.
    expect(await countThePicturesAndVectors()).toStrictEqual({pictures: 0, vectors: 0});
  });

  it('should leave the other Resources alone', async () => {
    const deleted = await api.createAnImageResourceRow('the beach.png', 'the beach');
    await api.createTextResource('the notes.md', 'the notes');

    await api.deleteImageResource(deleted.id);

    expect((await api.getResources()).map(row => row.name)).toStrictEqual([
      'the notes.md'
    ]);
  });

  it('should give 404 and resource_not_found for an identifier that no Resource holds', async () => {
    const resourceId = randomUUID();

    const response = await api.deleteImageResource(resourceId);

    expect(response.status).toBe(NOT_FOUND);
    expect(await response.json()).toStrictEqual({
      errors: [{code: 'resource_not_found', params: {resourceId}}]
    } satisfies ApiError);
  });

  it('should give 400 and invalid_input for an identifier that is not a UUID', async () => {
    const response = await api.deleteImageResource('not-a-uuid');

    expect(response.status).toBe(BAD_REQUEST);
    expect(await response.json()).toStrictEqual({
      errors: [{code: 'invalid_input', params: {path: 'id'}}]
    } satisfies ApiError);
  });

  const countThePicturesAndVectors = async (): Promise<{
    pictures: number;
    vectors: number;
  }> => {
    const {rows} = await testDatabase().query<{pictures: number; vectors: number}>(
      `SELECT (SELECT count(*) FROM pictures)::int AS pictures,
              (SELECT count(*) FROM picture_vectors_768)::int AS vectors`
    );

    return rows[0] as {pictures: number; vectors: number};
  };

  // Reads the URL, and never waits on the bus (ADR-0024).
  const statusOnceDeleted = async (url: string): Promise<number> => {
    const deadline = Date.now() + DELETE_TIME_LIMIT_IN_MS;
    let {status} = await fetch(url);

    while (status !== NOT_FOUND && Date.now() < deadline) {
      await new Promise(resolve => setTimeout(resolve, READ_INTERVAL_IN_MS));
      ({status} = await fetch(url));
    }

    return status;
  };
});
