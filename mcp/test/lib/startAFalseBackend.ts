import {createServer, type IncomingMessage, type ServerResponse} from 'node:http';
import type {AddressInfo} from 'node:net';

export type Answer = (request: IncomingMessage, response: ServerResponse) => void;

export const answerJson =
  (status: number, body: unknown): Answer =>
  (_request: IncomingMessage, response: ServerResponse): void => {
    response.writeHead(status, {'content-type': 'application/json'});
    response.end(JSON.stringify(body));
  };

export type Routes = Record<`GET /${string}`, Answer>;

export const startAFalseBackend = async (routes: Routes): Promise<string> => {
  const answers: Partial<Record<string, Answer>> = routes;
  const server = createServer((request, response) => {
    const {pathname} = new URL(request.url ?? '/', 'http://localhost');
    const answer = answers[`${request.method} ${pathname}`];

    if (answer === undefined) {
      response.writeHead(404).end();
      return;
    }

    answer(request, response);
  });

  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  onTestFinished(
    () =>
      new Promise<void>(resolve => {
        server.closeAllConnections();
        server.close(() => resolve());
      })
  );

  return `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
};
