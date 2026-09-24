import {ValueObjectError} from '../../../shared/domain/errors/ValueObjectError';
import {ValueObject} from '../../../shared/domain/value-objects/ValueObject';

type ConstructorParams = {value: string};

const VALUE_OBJECT_NAME = 'text of a Chunk';
const LETTER_OR_DIGIT = /[\p{L}\p{N}]/u;

export class ChunkText extends ValueObject<string> {
  private constructor(params: ConstructorParams) {
    super(params);
  }

  public static of({value}: ConstructorParams): ChunkText {
    const text = value.trim();

    if (text.length === 0) {
      throw ValueObjectError.causeItIsEmpty(VALUE_OBJECT_NAME);
    }

    if (!LETTER_OR_DIGIT.test(text)) {
      throw ValueObjectError.causeItHoldsNoLetterAndNoDigit(VALUE_OBJECT_NAME);
    }

    return new ChunkText({value: text});
  }

  public static fromPrimitive(params: ConstructorParams): ChunkText {
    return new ChunkText(params);
  }
}
