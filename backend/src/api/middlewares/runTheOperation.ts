import type {NextFunction, Request, Response} from 'express';
import type {OperationRunner} from '../../core/shared/domain/services/OperationRunner';

// On each route, not on the app: only the router knows the route, with no ids.
export const runTheOperation =
  (operationRunner: OperationRunner) =>
  <P>(request: Request<P>, response: Response, next: NextFunction): void => {
    let body: unknown;
    const json = response.json.bind(response);

    // The JSON of the response is the output of the trace (ADR-0048).
    response.json = (value: unknown): Response => {
      body = value;

      return json(value);
    };

    operationRunner
      .run(
        `${request.method} ${request.route.path}`,
        () =>
          new Promise<unknown>(resolve => {
            response.once('close', () => resolve(body));
            next();
          }),
        {params: request.params, query: request.query}
      )
      .catch((error: unknown) => {
        console.error(
          `The operation of ${request.method} ${request.route.path} broke`,
          error
        );
      });
  };
