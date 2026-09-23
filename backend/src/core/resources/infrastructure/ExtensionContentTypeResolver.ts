import {extname} from 'node:path';
import {CONTENT_TYPE_BY_EXTENSION} from 'contract/ContentTypeByExtension';
import {UnsupportedContentTypeError} from '../domain/errors/UnsupportedContentTypeError';
import type {ContentTypeResolver} from '../domain/services/ContentTypeResolver';
import {ContentType} from '../domain/value-objects/ContentType';

export class ExtensionContentTypeResolver implements ContentTypeResolver {
  public resolve(name: string): ContentType {
    const contentType = CONTENT_TYPE_BY_EXTENSION.get(extname(name).toLowerCase());

    if (contentType === undefined) {
      throw UnsupportedContentTypeError.causeTheNameHoldsNoKnownExtension(name);
    }

    return ContentType.of({value: contentType});
  }
}
