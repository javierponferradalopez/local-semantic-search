import {DomainError} from '../../../shared/domain/errors/DomainError';

export class UnsupportedContentTypeError extends DomainError {
  private readonly _fileName: string;

  private constructor(fileName: string) {
    super(`The name ${fileName} holds no extension that the Gate admits`);
    this._fileName = fileName;
  }

  public static causeTheNameHoldsNoAdmittedExtension(
    fileName: string
  ): UnsupportedContentTypeError {
    return new UnsupportedContentTypeError(fileName);
  }

  public get fileName(): string {
    return this._fileName;
  }
}
