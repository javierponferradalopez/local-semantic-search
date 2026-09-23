import type {ApiError} from 'contract/ApiError';
import {DuplicateResourceError} from '../../core/resources/domain/errors/DuplicateResourceError';

export type ApiErrorResponse = {status: number; body: ApiError};

const CONFLICT = 409;

export const ApiErrorMapper = {
  of(error: unknown): ApiErrorResponse | undefined {
    if (error instanceof DuplicateResourceError) {
      return {
        status: CONFLICT,
        body: {errors: [{code: 'duplicate_resource', params: error.resource}]}
      };
    }

    return undefined;
  }
};
