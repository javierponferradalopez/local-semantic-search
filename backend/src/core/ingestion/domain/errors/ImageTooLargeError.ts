import type {ContentType} from 'contract/ContentType';
import {DomainError} from '../../../shared/domain/errors/DomainError';

export class ImageTooLargeError extends DomainError {
  private constructor(message: string, options: ErrorOptions) {
    super(message, options);
  }

  public static causeItHoldsMorePixelsThanTheCeiling(
    contentType: ContentType,
    cause: unknown
  ): ImageTooLargeError {
    return new ImageTooLargeError(
      `The ${contentType} holds more pixels than the ceiling`,
      {
        cause
      }
    );
  }
}
