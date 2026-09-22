import {DomainError} from './DomainError';

export class ValueObjectError extends DomainError {
  private constructor(message: string) {
    super(message);
  }

  public static causeItIsEmpty(valueObject: string): ValueObjectError {
    return new ValueObjectError(`A ${valueObject} is empty`);
  }

  public static causeItIsNotAUuid(valueObject: string, value: string): ValueObjectError {
    return new ValueObjectError(`The ${valueObject} ${value} is not a UUID`);
  }

  public static causeItIsNotHexadecimal(
    valueObject: string,
    value: string
  ): ValueObjectError {
    return new ValueObjectError(`The ${valueObject} ${value} is not hexadecimal`);
  }

  public static causeItIsNotAnInstant(valueObject: string): ValueObjectError {
    return new ValueObjectError(`The ${valueObject} is not an instant`);
  }

  public static causeItIsNotOneOf(
    valueObject: string,
    value: string,
    admitted: readonly string[]
  ): ValueObjectError {
    return new ValueObjectError(
      `The ${valueObject} ${value} is not one of ${admitted.join(', ')}`
    );
  }

  public static causeItEscapesItsFolder(
    valueObject: string,
    value: string
  ): ValueObjectError {
    return new ValueObjectError(`The ${valueObject} ${value} escapes its folder`);
  }
}
