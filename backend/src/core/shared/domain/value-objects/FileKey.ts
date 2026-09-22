import {ValueObjectError} from '../errors/ValueObjectError';
import {ValueObject} from './ValueObject';

type ConstructorParams = {value: string};

const VALUE_OBJECT_NAME = 'File key';
const SEGMENT_THAT_NAMES_A_CHILD = /[^.]/;

const hasABlankSegment = (value: string): boolean =>
  value.split('/').some(segment => segment.trim().length === 0);

const staysInsideItsFolder = (value: string): boolean =>
  value.split('/').every(segment => SEGMENT_THAT_NAMES_A_CHILD.test(segment));

export class FileKey extends ValueObject<string> {
  private constructor(params: ConstructorParams) {
    super(params);
  }

  public static of({value}: ConstructorParams): FileKey {
    if (hasABlankSegment(value)) {
      throw ValueObjectError.causeItIsEmpty(VALUE_OBJECT_NAME);
    }

    if (!staysInsideItsFolder(value)) {
      throw ValueObjectError.causeItEscapesItsFolder(VALUE_OBJECT_NAME, value);
    }

    return new FileKey({value});
  }

  public static fromPrimitive(params: ConstructorParams): FileKey {
    return new FileKey(params);
  }
}
