import type {ApiError} from 'contract/ApiError';
import type {SessionHeaders} from 'contract/SessionHeaders';
import {HttpSearchGateway} from '@/gateways/http/HttpSearchGateway';
import {Refusal} from '@/gateways/Refusal';
import {stubTheFetch} from '../../../utils/stubTheFetch';

const SESSION_HEADERS: SessionHeaders = {
  'Session-Id': crypto.randomUUID(),
  'Session-Origin': 'interface'
};

const gateway = new HttpSearchGateway({sessionHeaders: SESSION_HEADERS});

const CALLS: [string, () => Promise<unknown>, string][] = [
  ['search', (): Promise<unknown> => gateway.search('octopus'), '/search?q=octopus'],
  [
    'matches',
    (): Promise<unknown> => gateway.matches('an id', 'octopus'),
    '/resources/texts/an%20id/matches?q=octopus'
  ]
];

describe('HttpSearchGateway', () => {
  describe.each(CALLS)('#%s', (_, call, path) => {
    it(`should send GET ${path}`, async () => {
      const fetch = stubTheFetch(200, {});

      await call();

      expect(fetch.mock.calls[0]?.[0]).toBe(path);
      expect(fetch.mock.calls[0]?.[1]?.method).toBeUndefined();
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
});
