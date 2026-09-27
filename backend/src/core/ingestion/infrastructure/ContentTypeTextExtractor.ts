import type {ContentType} from 'contract/ContentType';
import {extractText} from 'unpdf';
import {UnreadableFileError} from '../domain/errors/UnreadableFileError';
import type {TextExtractor} from '../domain/TextExtractor';

type Extract = (bytes: Buffer) => Promise<string[]>;

const DECODER = new TextDecoder('utf-8');

const textOf: Extract = async (bytes: Buffer) => [DECODER.decode(bytes)];

// Level 1 only: no item and no coordinate (ADR-0009).
// PDF.js takes the buffer that it gets, so it gets a copy.
const pagesOf: Extract = async (bytes: Buffer) => {
  try {
    return (await extractText(new Uint8Array(bytes))).text;
  } catch (error) {
    throw UnreadableFileError.causeTheBytesCannotBeReadAs('pdf', error);
  }
};

const EXTRACT: Record<ContentType, Extract> = {
  pdf: pagesOf,
  plain_text: textOf,
  markdown: textOf
};

export class ContentTypeTextExtractor implements TextExtractor {
  public extract(bytes: Buffer, contentType: ContentType): Promise<string[]> {
    return EXTRACT[contentType](bytes);
  }
}
