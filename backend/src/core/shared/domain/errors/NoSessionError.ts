import {DomainError} from './DomainError';

export class NoSessionError extends DomainError {
  private constructor(message: string) {
    super(message);
  }

  public static causeNoSessionIsOpen(): NoSessionError {
    return new NoSessionError('No Session is open around this work');
  }
}
