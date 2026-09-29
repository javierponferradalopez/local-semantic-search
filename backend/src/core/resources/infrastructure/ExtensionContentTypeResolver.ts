import {extname} from 'node:path';
import {
  IMAGE_CONTENT_TYPE_BY_EXTENSION,
  TEXT_CONTENT_TYPE_BY_EXTENSION
} from 'contract/ContentTypeByExtension';
import {UnsupportedContentTypeError} from '../domain/errors/UnsupportedContentTypeError';
import type {ContentTypeResolver} from '../domain/services/ContentTypeResolver';
import {ImageContentType} from '../domain/value-objects/ImageContentType';
import {TextContentType} from '../domain/value-objects/TextContentType';

const contentTypeIn = <T>(table: ReadonlyMap<string, T>, name: string): T => {
  const contentType = table.get(extname(name).toLowerCase());

  if (contentType === undefined) {
    throw UnsupportedContentTypeError.causeTheNameHoldsNoAdmittedExtension(name);
  }

  return contentType;
};

export class ExtensionContentTypeResolver implements ContentTypeResolver {
  public resolveText(name: string): TextContentType {
    return TextContentType.of({
      value: contentTypeIn(TEXT_CONTENT_TYPE_BY_EXTENSION, name)
    });
  }

  public resolveImage(name: string): ImageContentType {
    return ImageContentType.of({
      value: contentTypeIn(IMAGE_CONTENT_TYPE_BY_EXTENSION, name)
    });
  }
}
