import {
  IMAGE_CONTENT_TYPES,
  type ImageContentType as ImageContentTypeValue
} from 'contract/ContentType';
import {ValueObjectError} from '../../../shared/domain/errors/ValueObjectError';
import {ValueObject} from '../../../shared/domain/value-objects/ValueObject';

type ConstructorParams = {value: ImageContentTypeValue};

const VALUE_OBJECT_NAME = 'image Content type';

const isImageContentType = (value: string): value is ImageContentTypeValue =>
  IMAGE_CONTENT_TYPES.some(contentType => contentType === value);

export class ImageContentType extends ValueObject<ImageContentTypeValue> {
  private constructor(params: ConstructorParams) {
    super(params);
  }

  public static of({value}: {value: string}): ImageContentType {
    if (!isImageContentType(value)) {
      throw ValueObjectError.causeItIsNotOneOf(
        VALUE_OBJECT_NAME,
        value,
        IMAGE_CONTENT_TYPES
      );
    }

    return new ImageContentType({value});
  }

  public static fromPrimitive(params: ConstructorParams): ImageContentType {
    return new ImageContentType(params);
  }
}
