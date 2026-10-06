import type {IncomingMessage, ServerResponse} from 'node:http';
import type {ApiError} from 'contract/ApiError';
import type {GetResourcesResponse} from 'contract/GetResourcesResponse';
import {BackendUnavailable} from '../../../../src/gateways/BackendUnavailable';
import {HttpResourceGateway} from '../../../../src/gateways/http/HttpResourceGateway';
import {Refusal} from '../../../../src/gateways/Refusal';
import {answerJson, startAFalseBackend} from '../../../lib/startAFalseBackend';

const NO_BACKEND_URL = 'http://127.0.0.1:1';

describe('HttpResourceGateway', () => {
  describe('#list', () => {
    it('should give the Resources that GET /resources gives', async () => {
      const rows: GetResourcesResponse = [
        {
          id: '0b1c2d3e-0000-4000-8000-000000000001',
          name: 'scan.pdf',
          contentType: 'pdf',
          ingestState: 'failed',
          reason: 'no_text_found',
          createdAt: '2026-10-01T10:00:00.000Z',
          fileUrl: '/files/scan.pdf'
        }
      ];
      let requestUrl: string | undefined;
      const backendUrl = await startAFalseBackend({
        'GET /resources': (request: IncomingMessage, response: ServerResponse): void => {
          requestUrl = request.url;
          answerJson(200, rows)(request, response);
        }
      });

      const resources = await new HttpResourceGateway({backendUrl}).list();

      expect(requestUrl).toBe('/resources');
      expect(resources).toEqual(rows);
    });

    it('should refuse with the codes of an ApiError', async () => {
      const apiError: ApiError = {errors: [{code: 'invalid_input', params: {path: 'q'}}]};
      const backendUrl = await startAFalseBackend({
        'GET /resources': answerJson(400, apiError)
      });

      const error = await new HttpResourceGateway({backendUrl}).list().catch(e => e);

      expect(error).toBeInstanceOf(Refusal);
      expect(error.items).toEqual(apiError.errors);
    });

    it('should be unavailable when the backend refuses the connection', async () => {
      const error = await new HttpResourceGateway({backendUrl: NO_BACKEND_URL})
        .list()
        .catch(e => e);

      expect(error).toBeInstanceOf(BackendUnavailable);
      expect(error.address).toBe(NO_BACKEND_URL);
    });
  });
});
