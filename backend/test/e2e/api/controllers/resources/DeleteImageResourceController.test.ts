import {randomUUID} from 'node:crypto';
import type {ApiError} from 'contract/ApiError';
import {useTheTestApi} from '../../../../lib/testApi';

const NO_CONTENT = 204;
const BAD_REQUEST = 400;
const NOT_FOUND = 404;

describe('DELETE /resources/images/:id', () => {
  const api = useTheTestApi();

  it('should give 204, and leave no row and no File', async () => {
    const created = await api.createAnImageResourceRow('the beach.png', 'the beach');

    const response = await api.deleteImageResource(created.id);

    expect(response.status).toBe(NO_CONTENT);
    await api.expectNothingStored();
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
});
