import type {IncomingMessage, ServerResponse} from 'node:http';
import {startAFalseBackend} from '../../lib/startAFalseBackend';

describe('startAFalseBackend', () => {
  it('should answer a route as the test says', async () => {
    const backendUrl = await startAFalseBackend({
      'GET /resources': (_request: IncomingMessage, response: ServerResponse) => {
        response.writeHead(200, {'content-type': 'application/json'});
        response.end(JSON.stringify({resources: []}));
      }
    });

    const response = await fetch(new URL('/resources?q=a', backendUrl));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({resources: []});
  });

  it('should answer 404 to a route that the test does not give', async () => {
    const backendUrl = await startAFalseBackend({});

    const response = await fetch(new URL('/resources', backendUrl));

    expect(response.status).toBe(404);
  });
});
