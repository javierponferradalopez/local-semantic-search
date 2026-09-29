import {
  TEXT_CONTENT_TYPES,
  type TextContentType as TextContentTypeValue
} from 'contract/ContentType';
import {ValueObjectError} from '../../../shared/domain/errors/ValueObjectError';
import {ValueObject} from '../../../shared/domain/value-objects/ValueObject';

type ConstructorParams = {value: TextContentTypeValue};

const VALUE_OBJECT_NAME = 'text Content type';

const isTextContentType = (value: string): value is TextContentTypeValue =>
  TEXT_CONTENT_TYPES.some(contentType => contentType === value);

export class TextContentType extends ValueObject<TextContentTypeValue> {
  private constructor(params: ConstructorParams) {
    super(params);
  }

  public static of({value}: {value: string}): TextContentType {
    if (!isTextContentType(value)) {
      throw ValueObjectError.causeItIsNotOneOf(
        VALUE_OBJECT_NAME,
        value,
        TEXT_CONTENT_TYPES
      );
    }

    return new TextContentType({value});
  }

  public static fromPrimitive(params: ConstructorParams): TextContentType {
    return new TextContentType(params);
  }
}
