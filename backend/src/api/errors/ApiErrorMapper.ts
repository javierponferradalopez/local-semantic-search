import type {ApiError} from 'contract/ApiError';
import {DuplicateResourceError} from '../../core/resources/domain/errors/DuplicateResourceError';
import {UnsupportedContentTypeError} from '../../core/resources/domain/errors/UnsupportedContentTypeError';
import {FileTooLargeError} from './FileTooLargeError';
import {MultipleFilesError} from './MultipleFilesError';

export type ApiErrorResponse = {status: number; body: ApiError};

const BAD_REQUEST = 400;
const CONFLICT = 409;
const CONTENT_TOO_LARGE = 413;

export const ApiErrorMapper = {
  of(error: unknown): ApiErrorResponse | undefined {
    if (error instanceof UnsupportedContentTypeError) {
      return {
        status: BAD_REQUEST,
        body: {
          errors: [{code: 'unsupported_content_type', params: {name: error.fileName}}]
        }
      };
    }

    if (error instanceof FileTooLargeError) {
      const {sizeInBytes, limitInBytes} = error;

      return {
        status: CONTENT_TOO_LARGE,
        body: {errors: [{code: 'file_too_large', params: {sizeInBytes, limitInBytes}}]}
      };
    }

    if (error instanceof DuplicateResourceError) {
      return {
        status: CONFLICT,
        body: {errors: [{code: 'duplicate_resource', params: error.resource}]}
      };
    }

    if (error instanceof MultipleFilesError) {
      return {
        status: BAD_REQUEST,
        body: {errors: [{code: 'multiple_files', params: {count: error.count}}]}
      };
    }

    return undefined;
  }
};
