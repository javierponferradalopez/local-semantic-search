import {randomUUID} from 'node:crypto';
import {ValueObjectError} from '../../../shared/domain/errors/ValueObjectError';
import {ValueObject} from '../../../shared/domain/value-objects/ValueObject';

type ConstructorParams = {value: string};

const VALUE_OBJECT_NAME = 'Resource identifier';
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class ResourceId extends ValueObject<string> {
  private constructor(params: ConstructorParams) {
    super(params);
  }

  public static of({value}: ConstructorParams): ResourceId {
    if (!UUID_PATTERN.test(value)) {
      throw ValueObjectError.causeItIsNotAUuid(VALUE_OBJECT_NAME, value);
    }

    return new ResourceId({value});
  }

  public static fromPrimitive(params: ConstructorParams): ResourceId {
    return new ResourceId(params);
  }

  public static random(): ResourceId {
    return new ResourceId({value: randomUUID()});
  }
}
