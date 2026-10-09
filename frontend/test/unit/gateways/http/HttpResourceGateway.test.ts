import type {ApiError} from 'contract/ApiError';
import {CreateTextResourceRequest} from 'contract/CreateTextResourceRequest';
import type {SessionHeaders} from 'contract/SessionHeaders';
import {HttpResourceGateway} from '@/gateways/http/HttpResourceGateway';
import {Refusal} from '@/gateways/Refusal';
import {stubTheFetch} from '../../../utils/stubTheFetch';

const SESSION_HEADERS: SessionHeaders = {
  'Session-Id': crypto.randomUUID(),
  'Session-Origin': 'interface'
};

const A_FILE = new File(['the notes'], 'the notes.md');

const gateway = new HttpResourceGateway({sessionHeaders: SESSION_HEADERS});

const CALLS: [string, () => Promise<unknown>, string, string | undefined][] = [
  ['list', (): Promise<unknown> => gateway.list(), '/resources', undefined],
  [
    'createTextResource',
    (): Promise<unknown> => gateway.createTextResource(A_FILE),
    '/resources/texts',
    'POST'
  ],
  [
    'createImageResource',
    (): Promise<unknown> => gateway.createImageResource(A_FILE),
    '/resources/images',
    'POST'
  ],
  [
    'deleteTextResource',
    (): Promise<unknown> => gateway.deleteTextResource('an-id'),
    '/resources/texts/an-id',
    'DELETE'
  ],
  [
    'deleteImageResource',
    (): Promise<unknown> => gateway.deleteImageResource('an-id'),
    '/resources/images/an-id',
    'DELETE'
  ],
  [
    'retryTextResource',
    (): Promise<unknown> => gateway.retryTextResource('an-id'),
    '/resources/texts/an-id/retry',
    'POST'
  ],
  [
    'retryImageResource',
    (): Promise<unknown> => gateway.retryImageResource('an-id'),
    '/resources/images/an-id/retry',
    'POST'
  ]
];

describe('HttpResourceGateway', () => {
  describe.each(CALLS)('#%s', (_, call, path, method) => {
    it(`should send ${method ?? 'GET'} ${path}`, async () => {
      const fetch = stubTheFetch(200, {});

      await call();

      expect(fetch.mock.calls[0]?.[0]).toBe(path);
      expect(fetch.mock.calls[0]?.[1]?.method).toBe(method);
    });

    it('should send the Session in Session-Id and Session-Origin', async () => {
      const fetch = stubTheFetch(200, {});

      await call();

      expect(new Headers(fetch.mock.calls[0]?.[1]?.headers)).toEqual(
        new Headers(SESSION_HEADERS)
      );
    });

    it('should refuse with unauthenticated when the server gives 401', async () => {
      const apiError: ApiError = {errors: [{code: 'unauthenticated', params: {}}]};
      stubTheFetch(401, apiError);

      const error = (await call().catch(e => e)) as Refusal;

      expect(error).toBeInstanceOf(Refusal);
      expect(error.items).toEqual(apiError.errors);
    });
  });

  describe.each([
    ['createTextResource', (): Promise<unknown> => gateway.createTextResource(A_FILE)],
    ['createImageResource', (): Promise<unknown> => gateway.createImageResource(A_FILE)]
  ])('#%s', (_, call) => {
    it('should send the file in the body', async () => {
      const fetch = stubTheFetch(200, {});

      await call();

      const body = fetch.mock.calls[0]?.[1]?.body as FormData;
      expect((body.get(CreateTextResourceRequest.filePart) as File).name).toBe(
        A_FILE.name
      );
    });
  });
});
