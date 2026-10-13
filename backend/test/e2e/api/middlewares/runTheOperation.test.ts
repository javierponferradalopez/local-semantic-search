import type {MockInstance} from 'vitest';
import {container} from '../../../../src/api/config/di/Container';
import type {OperationRunner} from '../../../../src/core/shared/domain/services/OperationRunner';
import {useTheTestApi} from '../../../lib/testApi';
import {StringMother} from '../../../utils/object-mother/StringMother';

describe('runTheOperation', () => {
  const api = useTheTestApi();

  const spyTheOperations = (): MockInstance<OperationRunner['run']> =>
    vi.spyOn(container.getDependency<OperationRunner>('OperationRunner'), 'run');

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it.each([
    ['GET', '/search?q=octopus', 'GET /search'],
    [
      'GET',
      `/resources/texts/${StringMother.randomUuid()}/matches?q=octopus`,
      'GET /resources/texts/:id/matches'
    ],
    ['GET', '/resources', 'GET /resources'],
    [
      'DELETE',
      `/resources/images/${StringMother.randomUuid()}`,
      'DELETE /resources/images/:id'
    ],
    [
      'POST',
      `/resources/texts/${StringMother.randomUuid()}/retry`,
      'POST /resources/texts/:id/retry'
    ]
  ])('should open one operation for %s %s, named %s', async (method, path, name) => {
    const operations = spyTheOperations();

    await api.fetch(path, {method});

    expect(operations).toHaveBeenCalledOnce();
    expect(operations).toHaveBeenCalledWith(
      name,
      expect.any(Function),
      expect.anything()
    );
  });

  it('should give the params and the query of the request as the input of the operation', async () => {
    const id = StringMother.randomUuid();
    const operations = spyTheOperations();

    await api.fetch(`/resources/texts/${id}/matches?q=octopus`);

    expect(operations).toHaveBeenCalledWith(
      'GET /resources/texts/:id/matches',
      expect.any(Function),
      {params: {id}, query: {q: 'octopus'}}
    );
  });

  it('should end the operation with the JSON of the response when the response ends', async () => {
    const operations = spyTheOperations();

    const body: unknown = await (await api.search('octopus')).json();

    await expect(operations.mock.results[0]?.value).resolves.toStrictEqual(body);
  });

  it('should open no operation for a request with no Session', async () => {
    const operations = spyTheOperations();

    await fetch(`${api.origin()}/search?q=octopus`);

    expect(operations).not.toHaveBeenCalled();
  });

  it('should open no operation for a file under /files', async () => {
    const row = await api.createATextResourceRow('the notes.md', 'the notes');
    const operations = spyTheOperations();

    await fetch(`${api.origin()}${row.fileUrl}`);

    expect(operations).not.toHaveBeenCalled();
  });
});
