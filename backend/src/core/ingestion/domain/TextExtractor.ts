import type {ContentType} from 'contract/ContentType';

export interface TextExtractor {
  // One text for each page, or one text alone when the Content type has no pages.
  extract(bytes: Buffer, contentType: ContentType): Promise<string[]>;
}
