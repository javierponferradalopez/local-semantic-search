import {createHash} from 'node:crypto';
import {ValueObjectError} from '../../../shared/domain/errors/ValueObjectError';
import {ValueObject} from '../../../shared/domain/value-objects/ValueObject';

type ConstructorParams = {value: string};

const VALUE_OBJECT_NAME = 'Checksum';
const HEXADECIMAL_PATTERN = /^[0-9a-f]+$/;
const ALGORITHM = 'sha256';

export class Checksum extends ValueObject<string> {
  private constructor(params: ConstructorParams) {
    super(params);
  }

  public static of({value}: ConstructorParams): Checksum {
    if (!HEXADECIMAL_PATTERN.test(value)) {
      throw ValueObjectError.causeItIsNotHexadecimal(VALUE_OBJECT_NAME, value);
    }

    return new Checksum({value});
  }

  public static ofBytes({bytes}: {bytes: Buffer}): Checksum {
    return new Checksum({value: createHash(ALGORITHM).update(bytes).digest('hex')});
  }

  public static fromPrimitive(params: ConstructorParams): Checksum {
    return new Checksum(params);
  }
}
