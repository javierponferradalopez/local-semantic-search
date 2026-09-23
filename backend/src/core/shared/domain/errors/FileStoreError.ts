import {DomainError} from './DomainError';

export class FileStoreError extends DomainError {
  private constructor(message: string) {
    super(message);
  }

  public static causeTheKeyEscapesItsFolder(key: string): FileStoreError {
    return new FileStoreError(`The key ${key} escapes the folder the application owns`);
  }
}
