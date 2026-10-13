import type {NextFunction, Request, Response} from 'express';
import type {OperationRunner} from '../../core/shared/domain/services/OperationRunner';

// On each route, not on the app: only the router knows the route, with no ids.
export const runTheOperation =
  (operationRunner: OperationRunner) =>
  <P>(request: Request<P>, response: Response, next: NextFunction): void => {
    operationRunner
      .run(
        `${request.method} ${request.route.path}`,
        () =>
          new Promise<void>(resolve => {
            response.once('close', resolve);
            next();
          })
      )
      .catch((error: unknown) => {
        console.error(
          `The operation of ${request.method} ${request.route.path} broke`,
          error
        );
      });
  };
