import {randomUUID} from 'node:crypto';
import type {ApiError} from 'contract/ApiError';
import {useTheTestApi} from '../../../../lib/testApi';

const NO_CONTENT = 204;
const BAD_REQUEST = 400;
const NOT_FOUND = 404;

describe('DELETE /resources/texts/:id', () => {
  const api = useTheTestApi();

  it('should give 204, and leave no row and no File', async () => {
    const created = await api.createATextResourceRow('the notes.md', 'the notes');

    const response = await api.deleteTextResource(created.id);

    expect(response.status).toBe(NO_CONTENT);
    await api.expectNothingStored();
  });

  it('should leave the other Resources alone', async () => {
    const deleted = await api.createATextResourceRow('the first.md', 'the first');
    await api.createTextResource('the second.md', 'the second');

    await api.deleteTextResource(deleted.id);

    expect((await api.getResources()).map(row => row.name)).toStrictEqual([
      'the second.md'
    ]);
  });

  it('should give 404 and resource_not_found for an identifier that no Resource holds', async () => {
    const resourceId = randomUUID();

    const response = await api.deleteTextResource(resourceId);

    expect(response.status).toBe(NOT_FOUND);
    expect(response.headers.get('content-type')).toContain('application/json');
    expect(await response.json()).toStrictEqual({
      errors: [{code: 'resource_not_found', params: {resourceId}}]
    } satisfies ApiError);
  });

  it('should give 400 and invalid_input for an identifier that is not a UUID', async () => {
    const response = await api.deleteTextResource('not-a-uuid');

    expect(response.status).toBe(BAD_REQUEST);
    expect(await response.json()).toStrictEqual({
      errors: [{code: 'invalid_input', params: {path: 'id'}}]
    } satisfies ApiError);
  });
});
