import type {NextFunction, Request, Response} from 'express';
import {MultipleFilesError} from '../errors/MultipleFilesError';

export const takeOneFile = (
  request: Request,
  _response: Response,
  next: NextFunction
): void => {
  const files = Array.isArray(request.files) ? request.files : [];

  if (files.length > 1) {
    throw MultipleFilesError.causeMoreThanOneFileArrived(files.length);
  }

  request.file = files[0];
  next();
};
