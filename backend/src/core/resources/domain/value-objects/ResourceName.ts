import {ValueObjectError} from '../../../shared/domain/errors/ValueObjectError';
import {ValueObject} from '../../../shared/domain/value-objects/ValueObject';

type ConstructorParams = {value: string};

const VALUE_OBJECT_NAME = 'Resource name';

export class ResourceName extends ValueObject<string> {
  private constructor(params: ConstructorParams) {
    super(params);
  }

  public static of({value}: ConstructorParams): ResourceName {
    const name = value.trim();

    if (name.length === 0) {
      throw ValueObjectError.causeItIsEmpty(VALUE_OBJECT_NAME);
    }

    return new ResourceName({value: name});
  }

  public static fromPrimitive(params: ConstructorParams): ResourceName {
    return new ResourceName(params);
  }
}
