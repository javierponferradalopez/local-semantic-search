import {MAXIMUM_FILE_SIZE_IN_BYTES} from 'contract/MaximumFileSizeInBytes';
import type {NextFunction, Request, Response} from 'express';
import {FileTooLargeError} from '../errors/FileTooLargeError';

export const refuseAFileTooLarge = (
  request: Request,
  _response: Response,
  next: NextFunction
): void => {
  const sizeInBytes = Number(request.headers['content-length']);

  if (sizeInBytes > MAXIMUM_FILE_SIZE_IN_BYTES) {
    throw FileTooLargeError.causeTheBodyIsAboveTheLimit({
      sizeInBytes,
      limitInBytes: MAXIMUM_FILE_SIZE_IN_BYTES
    });
  }

  next();
};
