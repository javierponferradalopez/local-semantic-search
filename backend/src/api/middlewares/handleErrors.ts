import type {NextFunction, Request, Response} from 'express';
import {ApiErrorMapper} from '../errors/ApiErrorMapper';

const INTERNAL_SERVER_ERROR = 500;

export const handleErrors = (
  error: unknown,
  _request: Request,
  response: Response,
  next: NextFunction
): void => {
  if (response.headersSent) {
    next(error);

    return;
  }

  const apiError = ApiErrorMapper.of(error);

  if (apiError === undefined) {
    console.error(error);
    response.status(INTERNAL_SERVER_ERROR).end();

    return;
  }

  response.status(apiError.status).json(apiError.body);
};
