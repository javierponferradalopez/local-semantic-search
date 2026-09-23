import {DomainError} from '../../../shared/domain/errors/DomainError';

export class UnsupportedContentTypeError extends DomainError {
  private constructor(message: string) {
    super(message);
  }

  public static causeTheNameHoldsNoKnownExtension(
    name: string
  ): UnsupportedContentTypeError {
    return new UnsupportedContentTypeError(`The name ${name} names no Content type`);
  }
}
