import type {TextContentType} from 'contract/ContentType';

export interface TextExtractor {
  // One text for each page, or one text alone when the Content type has no pages.
  // It rejects with UnreadableFileError when its library cannot read the bytes.
  extract(bytes: Buffer, contentType: TextContentType): Promise<string[]>;
}
