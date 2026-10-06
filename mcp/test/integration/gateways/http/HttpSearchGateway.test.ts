import type {IncomingMessage, ServerResponse} from 'node:http';
import type {ApiError} from 'contract/ApiError';
import type {SearchResponse} from 'contract/SearchResponse';
import {BackendUnavailable} from '../../../../src/gateways/BackendUnavailable';
import {HttpSearchGateway} from '../../../../src/gateways/http/HttpSearchGateway';
import {Refusal} from '../../../../src/gateways/Refusal';
import {answerJson, startAFalseBackend} from '../../../lib/startAFalseBackend';

const NO_BACKEND_URL = 'http://127.0.0.1:1';

describe('HttpSearchGateway', () => {
  describe('#search', () => {
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

      const response = await new HttpSearchGateway({backendUrl}).search('arms & legs?');

      expect(requestUrl).toBe('/search?q=arms+%26+legs%3F');
      expect(response).toEqual(groups);
    });

    it('should refuse with the codes of an ApiError', async () => {
      const apiError: ApiError = {errors: [{code: 'invalid_input', params: {path: 'q'}}]};
      const backendUrl = await startAFalseBackend({
        'GET /search': answerJson(400, apiError)
      });

      const error = await new HttpSearchGateway({backendUrl}).search(' ').catch(e => e);

      expect(error).toBeInstanceOf(Refusal);
      expect(error.items).toEqual(apiError.errors);
    });

    it('should be unavailable when the backend refuses the connection', async () => {
      const error = await new HttpSearchGateway({backendUrl: NO_BACKEND_URL})
        .search('octopus')
        .catch(e => e);

      expect(error).toBeInstanceOf(BackendUnavailable);
      expect(error.address).toBe(NO_BACKEND_URL);
    });
  });
});
