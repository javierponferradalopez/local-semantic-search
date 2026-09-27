import type {ContentType} from 'contract/ContentType';
import {DomainError} from '../../../shared/domain/errors/DomainError';

export class UnreadableFileError extends DomainError {
  private constructor(message: string, options: ErrorOptions) {
    super(message, options);
  }

  public static causeTheBytesCannotBeReadAs(
    contentType: ContentType,
    cause: unknown
  ): UnreadableFileError {
    return new UnreadableFileError(`The bytes cannot be read as ${contentType}`, {cause});
  }
}
