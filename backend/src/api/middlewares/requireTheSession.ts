import type {SessionHeaders} from 'contract/SessionHeaders';
import type {NextFunction, Request, RequestHandler, Response} from 'express';
import type {SessionRunner} from '../../core/shared/domain/services/SessionRunner';
import {Session} from '../../core/shared/domain/value-objects/Session';
import {UnauthenticatedError} from '../errors/UnauthenticatedError';

const headerOf = (request: Request, name: keyof SessionHeaders): string =>
  request.get(name) ?? '';

const sessionOf = (request: Request): Session => {
  try {
    return Session.of({
      id: headerOf(request, 'Session-Id'),
      origin: headerOf(request, 'Session-Origin')
    });
  } catch (cause) {
    throw UnauthenticatedError.causeTheRequestHoldsNoSession(cause);
  }
};

export const requireTheSession =
  (sessionRunner: SessionRunner): RequestHandler =>
  (request: Request, _response: Response, next: NextFunction): void => {
    sessionRunner.run(sessionOf(request), next);
  };
