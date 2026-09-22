import {ValueObjectError} from '../../../shared/domain/errors/ValueObjectError';
import {ValueObject} from '../../../shared/domain/value-objects/ValueObject';

type ConstructorParams = {value: Date};

const VALUE_OBJECT_NAME = 'date a Resource was created';

export class CreatedAt extends ValueObject<Date> {
  private constructor(params: ConstructorParams) {
    super(params);
  }

  public static of({value}: ConstructorParams): CreatedAt {
    if (Number.isNaN(value.getTime())) {
      throw ValueObjectError.causeItIsNotAnInstant(VALUE_OBJECT_NAME);
    }

    return new CreatedAt({value});
  }

  public static fromPrimitive({value}: {value: string}): CreatedAt {
    return new CreatedAt({value: new Date(value)});
  }
}
