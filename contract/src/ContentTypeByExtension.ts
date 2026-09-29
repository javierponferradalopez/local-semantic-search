import type {ContentType, ImageContentType, TextContentType} from './ContentType';

export const TEXT_CONTENT_TYPE_BY_EXTENSION: ReadonlyMap<string, TextContentType> =
  new Map([
    ['.pdf', 'pdf'],
    ['.txt', 'plain_text'],
    ['.md', 'markdown']
  ]);

// TIFF and HEIC stay out: the browser does not paint a TIFF, and sharp does not decode a HEIC.
export const IMAGE_CONTENT_TYPE_BY_EXTENSION: ReadonlyMap<string, ImageContentType> =
  new Map([
    ['.jpg', 'jpeg'],
    ['.jpeg', 'jpeg'],
    ['.png', 'png'],
    ['.webp', 'webp'],
    ['.gif', 'gif'],
    ['.avif', 'avif'],
    ['.svg', 'svg']
  ]);

export const CONTENT_TYPE_BY_EXTENSION: ReadonlyMap<string, ContentType> = new Map<
  string,
  ContentType
>([...TEXT_CONTENT_TYPE_BY_EXTENSION, ...IMAGE_CONTENT_TYPE_BY_EXTENSION]);
