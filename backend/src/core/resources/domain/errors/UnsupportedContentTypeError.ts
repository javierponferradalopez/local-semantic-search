import {DomainError} from '../../../shared/domain/errors/DomainError';

export class UnsupportedContentTypeError extends DomainError {
  private readonly _fileName: string;

  private constructor(fileName: string) {
    super(`The name ${fileName} names no Content type`);
    this._fileName = fileName;
  }

  public static causeTheNameHoldsNoKnownExtension(
    fileName: string
  ): UnsupportedContentTypeError {
    return new UnsupportedContentTypeError(fileName);
  }

  public get fileName(): string {
    return this._fileName;
  }
}
