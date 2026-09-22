import {CONTENT_TYPES, type ContentType as ContentTypeValue} from 'contract/ContentType';
import {ValueObjectError} from '../../../shared/domain/errors/ValueObjectError';
import {ValueObject} from '../../../shared/domain/value-objects/ValueObject';

type ConstructorParams = {value: ContentTypeValue};

const VALUE_OBJECT_NAME = 'Content type';

const isContentType = (value: string): value is ContentTypeValue =>
  CONTENT_TYPES.some(contentType => contentType === value);

export class ContentType extends ValueObject<ContentTypeValue> {
  private constructor(params: ConstructorParams) {
    super(params);
  }

  public static of({value}: {value: string}): ContentType {
    if (!isContentType(value)) {
      throw ValueObjectError.causeItIsNotOneOf(VALUE_OBJECT_NAME, value, CONTENT_TYPES);
    }

    return new ContentType({value});
  }

  public static fromPrimitive(params: ConstructorParams): ContentType {
    return new ContentType(params);
  }
}
