import {randomUUID} from 'node:crypto';
import type {IncomingMessage, ServerResponse} from 'node:http';
import type {ApiError} from 'contract/ApiError';
import type {GetMatchesResponse} from 'contract/GetMatchesResponse';
import type {SearchResponse} from 'contract/SearchResponse';
import type {SessionHeaders} from 'contract/SessionHeaders';
import {BackendUnavailable} from '../../../../src/gateways/BackendUnavailable';
import {HttpSearchGateway} from '../../../../src/gateways/http/HttpSearchGateway';
import {Refusal} from '../../../../src/gateways/Refusal';
import {answerJson, startAFalseBackend} from '../../../lib/startAFalseBackend';

const NO_BACKEND_URL = 'http://127.0.0.1:1';

const SESSION_HEADERS: SessionHeaders = {
  'Session-Id': randomUUID(),
  'Session-Origin': 'mcp'
};

const sessionHeadersOf = (request: IncomingMessage): Record<string, unknown> => ({
  'Session-Id': request.headers['session-id'],
  'Session-Origin': request.headers['session-origin']
});

describe('HttpSearchGateway', () => {
  describe('#search', () => {
    it('should send the Session in Session-Id and Session-Origin', async () => {
      let sessionHeaders: Record<string, unknown> | undefined;
      const backendUrl = await startAFalseBackend({
        'GET /search': (request: IncomingMessage, response: ServerResponse): void => {
          sessionHeaders = sessionHeadersOf(request);
          answerJson(200, {text: [], images: []})(request, response);
        }
      });

      await new HttpSearchGateway({backendUrl, sessionHeaders: SESSION_HEADERS}).search(
        'octopus'
      );

      expect(sessionHeaders).toEqual(SESSION_HEADERS);
    });

    it('should refuse with unauthenticated when the backend gives 401', async () => {
      const apiError: ApiError = {errors: [{code: 'unauthenticated', params: {}}]};
      const backendUrl = await startAFalseBackend({
        'GET /search': answerJson(401, apiError)
      });

      const error = await new HttpSearchGateway({
        backendUrl,
        sessionHeaders: SESSION_HEADERS
      })
        .search('octopus')
        .catch(e => e);

      expect(error).toBeInstanceOf(Refusal);
      expect(error.items).toEqual(apiError.errors);
    });

    it('should give the groups that GET /search gives for the Query', async () => {
      const groups: SearchResponse = {
        text: [
          {
            resourceId: '0b1c2d3e-0000-4000-8000-000000000001',
            name: 'report.pdf',
            contentType: 'pdf',
            text: 'The octopus has eight arms.',
            page: 3,
            fileUrl: '/files/report.pdf'
          }
        ],
        images: [
          {
            resourceId: '0b1c2d3e-0000-4000-8000-000000000002',
            name: 'octopus.png',
            fileUrl: '/files/octopus.png',
            thumbnailUrl: '/thumbnails/octopus.png'
          }
        ]
      };
      let requestUrl: string | undefined;
      const backendUrl = await startAFalseBackend({
        'GET /search': (request: IncomingMessage, response: ServerResponse): void => {
          requestUrl = request.url;
          answerJson(200, groups)(request, response);
        }
      });

      const response = await new HttpSearchGateway({
        backendUrl,
        sessionHeaders: SESSION_HEADERS
      }).search('arms & legs?');

      expect(requestUrl).toBe('/search?q=arms+%26+legs%3F');
      expect(response).toEqual(groups);
    });

    it('should refuse with the codes of an ApiError', async () => {
      const apiError: ApiError = {errors: [{code: 'invalid_input', params: {path: 'q'}}]};
      const backendUrl = await startAFalseBackend({
        'GET /search': answerJson(400, apiError)
      });

      const error = await new HttpSearchGateway({
        backendUrl,
        sessionHeaders: SESSION_HEADERS
      })
        .search(' ')
        .catch(e => e);

      expect(error).toBeInstanceOf(Refusal);
      expect(error.items).toEqual(apiError.errors);
    });

    it('should be unavailable when the backend refuses the connection', async () => {
      const error = await new HttpSearchGateway({
        backendUrl: NO_BACKEND_URL,
        sessionHeaders: SESSION_HEADERS
      })
        .search('octopus')
        .catch(e => e);

      expect(error).toBeInstanceOf(BackendUnavailable);
      expect(error.address).toBe(NO_BACKEND_URL);
    });
  });

  describe('#matches', () => {
    it('should send the Session in Session-Id and Session-Origin', async () => {
      let sessionHeaders: Record<string, unknown> | undefined;
      const backendUrl = await startAFalseBackend({
        'GET /resources/texts/an-id/matches': (
          request: IncomingMessage,
          response: ServerResponse
        ): void => {
          sessionHeaders = sessionHeadersOf(request);
          answerJson(200, [])(request, response);
        }
      });

      await new HttpSearchGateway({backendUrl, sessionHeaders: SESSION_HEADERS}).matches(
        'an-id',
        'octopus'
      );

      expect(sessionHeaders).toEqual(SESSION_HEADERS);
    });

    it('should give the Matches that GET /resources/texts/:id/matches gives for the Query', async () => {
      const matches: GetMatchesResponse = [
        {text: 'The octopus has eight arms.', page: 3},
        {text: 'Each arm has suckers.'}
      ];
      let requestUrl: string | undefined;
      const backendUrl = await startAFalseBackend({
        'GET /resources/texts/0b1c2d3e-0000-4000-8000-000000000001/matches': (
          request: IncomingMessage,
          response: ServerResponse
        ): void => {
          requestUrl = request.url;
          answerJson(200, matches)(request, response);
        }
      });

      const response = await new HttpSearchGateway({
        backendUrl,
        sessionHeaders: SESSION_HEADERS
      }).matches('0b1c2d3e-0000-4000-8000-000000000001', 'arms & legs?');

      expect(requestUrl).toBe(
        '/resources/texts/0b1c2d3e-0000-4000-8000-000000000001/matches?q=arms+%26+legs%3F'
      );
      expect(response).toEqual(matches);
    });

    it('should encode the id of the Resource in the path', async () => {
      let requestUrl: string | undefined;
      const backendUrl = await startAFalseBackend({
        'GET /resources/texts/a%2F..%3Fb/matches': (
          request: IncomingMessage,
          response: ServerResponse
        ): void => {
          requestUrl = request.url;
          answerJson(200, [])(request, response);
        }
      });

      await new HttpSearchGateway({backendUrl, sessionHeaders: SESSION_HEADERS}).matches(
        'a/..?b',
        'octopus'
      );

      expect(requestUrl).toBe('/resources/texts/a%2F..%3Fb/matches?q=octopus');
    });

    it('should refuse with the codes of an ApiError', async () => {
      const apiError: ApiError = {
        errors: [{code: 'resource_not_found', params: {resourceId: 'an-id'}}]
      };
      const backendUrl = await startAFalseBackend({
        'GET /resources/texts/an-id/matches': answerJson(404, apiError)
      });

      const error = await new HttpSearchGateway({
        backendUrl,
        sessionHeaders: SESSION_HEADERS
      })
        .matches('an-id', 'octopus')
        .catch(e => e);

      expect(error).toBeInstanceOf(Refusal);
      expect(error.items).toEqual(apiError.errors);
    });

    it('should be unavailable when the backend refuses the connection', async () => {
      const error = await new HttpSearchGateway({
        backendUrl: NO_BACKEND_URL,
        sessionHeaders: SESSION_HEADERS
      })
        .matches('an-id', 'octopus')
        .catch(e => e);

      expect(error).toBeInstanceOf(BackendUnavailable);
      expect(error.address).toBe(NO_BACKEND_URL);
    });
  });

  describe('#thumbnail', () => {
    it('should send the Session in Session-Id and Session-Origin', async () => {
      let sessionHeaders: Record<string, unknown> | undefined;
      const backendUrl = await startAFalseBackend({
        'GET /files/thumbnails/octopus.webp': (
          request: IncomingMessage,
          response: ServerResponse
        ): void => {
          sessionHeaders = sessionHeadersOf(request);
          response.writeHead(200, {'content-type': 'image/webp'});
          response.end();
        }
      });

      await new HttpSearchGateway({
        backendUrl,
        sessionHeaders: SESSION_HEADERS
      }).thumbnail('/files/thumbnails/octopus.webp');

      expect(sessionHeaders).toEqual(SESSION_HEADERS);
    });

    it('should give the bytes of the thumbnail and the media type of the response', async () => {
      const bytes = new Uint8Array([0x52, 0x49, 0x46, 0x46]);
      const backendUrl = await startAFalseBackend({
        'GET /files/thumbnails/octopus.webp': (
          _request: IncomingMessage,
          response: ServerResponse
        ): void => {
          response.writeHead(200, {'content-type': 'image/webp'});
          response.end(bytes);
        }
      });

      const thumbnail = await new HttpSearchGateway({
        backendUrl,
        sessionHeaders: SESSION_HEADERS
      }).thumbnail('/files/thumbnails/octopus.webp');

      expect(thumbnail).toEqual({bytes, mediaType: 'image/webp'});
    });

    it('should give the media type with no parameters', async () => {
      const backendUrl = await startAFalseBackend({
        'GET /files/thumbnails/octopus.webp': (
          _request: IncomingMessage,
          response: ServerResponse
        ): void => {
          response.writeHead(200, {'content-type': 'image/webp; charset=binary'});
          response.end();
        }
      });

      const {mediaType} = await new HttpSearchGateway({
        backendUrl,
        sessionHeaders: SESSION_HEADERS
      }).thumbnail('/files/thumbnails/octopus.webp');

      expect(mediaType).toBe('image/webp');
    });

    it('should refuse when the backend has no thumbnail at the URL', async () => {
      const backendUrl = await startAFalseBackend({});

      const error = await new HttpSearchGateway({
        backendUrl,
        sessionHeaders: SESSION_HEADERS
      })
        .thumbnail('/files/thumbnails/gone.webp')
        .catch(e => e);

      expect(error).toBeInstanceOf(Refusal);
    });

    it('should be unavailable when the backend refuses the connection', async () => {
      const error = await new HttpSearchGateway({
        backendUrl: NO_BACKEND_URL,
        sessionHeaders: SESSION_HEADERS
      })
        .thumbnail('/files/thumbnails/octopus.webp')
        .catch(e => e);

      expect(error).toBeInstanceOf(BackendUnavailable);
      expect(error.address).toBe(NO_BACKEND_URL);
    });
  });
});
