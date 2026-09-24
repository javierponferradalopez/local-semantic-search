import type {ContentType} from 'contract/ContentType';
import {DomainError} from '../../../shared/domain/errors/DomainError';

export class UnreadableFileError extends DomainError {
  private constructor(message: string) {
    super(message);
  }

  public static causeTheBytesCannotBeReadAs(
    contentType: ContentType
  ): UnreadableFileError {
    return new UnreadableFileError(`The bytes cannot be read as ${contentType}`);
  }
}
