import {ValueObjectError} from '../errors/ValueObjectError';
import {ValueObject} from './ValueObject';

type ConstructorParams = {value: string};

const VALUE_OBJECT_NAME = 'Session identifier';
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class SessionId extends ValueObject<string> {
  private constructor(params: ConstructorParams) {
    super(params);
  }

  public static of({value}: ConstructorParams): SessionId {
    if (!UUID_PATTERN.test(value)) {
      throw ValueObjectError.causeItIsNotAUuid(VALUE_OBJECT_NAME, value);
    }

    return new SessionId({value});
  }

  public static fromPrimitive(params: ConstructorParams): SessionId {
    return new SessionId(params);
  }
}
