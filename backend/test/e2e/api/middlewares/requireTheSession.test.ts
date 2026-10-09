import type {ApiError} from 'contract/ApiError';
import {CreateTextResourceRequest} from 'contract/CreateTextResourceRequest';
import type {SessionHeaders} from 'contract/SessionHeaders';
import type {Response as ExpressResponse} from 'express';
import {container} from '../../../../src/api/config/di/Container';
import {CreateTextResourceController} from '../../../../src/api/controllers/resources/CreateTextResourceController';
import {GetResourcesController} from '../../../../src/api/controllers/resources/GetResourcesController';
import {AsyncLocalStorageSessionRunner} from '../../../../src/core/shared/infrastructure/async-hooks/AsyncLocalStorageSessionRunner';
import {useTheTestApi} from '../../../lib/testApi';
import {StringMother} from '../../../utils/object-mother/StringMother';

const OK = 200;
const UNAUTHORIZED = 401;
const NOT_FOUND = 404;

const UNAUTHENTICATED: ApiError = {errors: [{code: 'unauthenticated', params: {}}]};

const aTick = (): Promise<void> => new Promise(resolve => setImmediate(resolve));

const aSession = (): SessionHeaders => ({
  'Session-Id': StringMother.randomUuid(),
  'Session-Origin': 'mcp'
});

describe('requireTheSession', () => {
  const api = useTheTestApi();

  const getResourcesWith = (headers: Record<string, string>): Promise<Response> =>
    fetch(`${api.origin()}/resources`, {headers});

  const answerTheCurrentSession = async (
    _request: unknown,
    response: ExpressResponse
  ): Promise<void> => {
    await aTick();
    const session = container.getDependency(AsyncLocalStorageSessionRunner).current();

    response.json({
      'Session-Id': session.id.value,
      'Session-Origin': session.origin.value
    });
  };

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it.each([
    ['mcp', 'mcp'],
    ['interface', 'interface']
  ])('should answer a request of the Origin %s', async (_, origin) => {
    const response = await getResourcesWith({...aSession(), 'Session-Origin': origin});

    expect(response.status).toBe(OK);
  });

  it.each([
    ['no Session-Id', {'Session-Origin': 'mcp'}],
    ['a Session-Id that is not a UUID', {...aSession(), 'Session-Id': 'a-session'}],
    ['no Session-Origin', {'Session-Id': StringMother.randomUuid()}],
    [
      'a Session-Origin that is not mcp or interface',
      {...aSession(), 'Session-Origin': 'agent'}
    ],
    ['no header', {}]
  ])('should give 401 and unauthenticated to a request with %s', async (_, headers) => {
    const response = await getResourcesWith(headers);

    expect(response.status).toBe(UNAUTHORIZED);
    expect(await response.json()).toStrictEqual(UNAUTHENTICATED);
  });

  it('should run the work of a request with the Session of its headers open', async () => {
    vi.spyOn(container.getDependency(GetResourcesController), 'run').mockImplementation(
      answerTheCurrentSession
    );
    const session = aSession();

    const response = await getResourcesWith(session);

    expect(await response.json()).toStrictEqual(session);
  });

  it('should keep the Session open after the files of a multipart body arrive', async () => {
    vi.spyOn(
      container.getDependency(CreateTextResourceController),
      'run'
    ).mockImplementation(answerTheCurrentSession);
    const session = aSession();
    const body = new FormData();
    body.append(
      CreateTextResourceRequest.filePart,
      new File(['x'.repeat(200_000)], 'the notes.md')
    );

    const response = await fetch(`${api.origin()}/resources/texts`, {
      method: 'POST',
      headers: session,
      body
    });

    expect(await response.json()).toStrictEqual(session);
  });

  it.each([
    ['POST', '/resources/texts'],
    ['POST', '/resources/images'],
    ['GET', '/resources'],
    ['DELETE', '/resources/texts/an-id'],
    ['DELETE', '/resources/images/an-id'],
    ['POST', '/resources/texts/an-id/retry'],
    ['POST', '/resources/images/an-id/retry'],
    ['GET', '/search?q=octopus'],
    ['GET', '/resources/texts/an-id/matches?q=octopus']
  ])('should give 401 to %s %s with no Session', async (method, path) => {
    const response = await fetch(`${api.origin()}${path}`, {method});

    expect(response.status).toBe(UNAUTHORIZED);
    expect(await response.json()).toStrictEqual(UNAUTHENTICATED);
  });

  it('should serve a file under /files with no header', async () => {
    const row = await api.createATextResourceRow('the notes.md', 'the notes');

    const response = await fetch(`${api.origin()}${row.fileUrl}`);

    expect(response.status).toBe(OK);
  });

  it('should give 404 to a path under /files that holds no file, with no header', async () => {
    const response = await fetch(`${api.origin()}/files/not-there.md`);

    expect(response.status).toBe(NOT_FOUND);
  });
});
