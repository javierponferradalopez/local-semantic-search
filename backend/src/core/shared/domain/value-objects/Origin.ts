import {ORIGINS, type Origin as OriginValue} from 'contract/Origin';
import {ValueObjectError} from '../errors/ValueObjectError';
import {ValueObject} from './ValueObject';

type ConstructorParams = {value: OriginValue};

const VALUE_OBJECT_NAME = 'Origin';

const isOrigin = (value: string): value is OriginValue =>
  ORIGINS.some(origin => origin === value);

export class Origin extends ValueObject<OriginValue> {
  private constructor(params: ConstructorParams) {
    super(params);
  }

  public static of({value}: {value: string}): Origin {
    if (!isOrigin(value)) {
      throw ValueObjectError.causeItIsNotOneOf(VALUE_OBJECT_NAME, value, ORIGINS);
    }

    return new Origin({value});
  }

  public static fromPrimitive(params: ConstructorParams): Origin {
    return new Origin(params);
  }
}
