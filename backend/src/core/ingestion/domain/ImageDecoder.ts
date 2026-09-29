import type {ContentType} from 'contract/ContentType';
import type {Pixels} from '../../shared/domain/services/ImageEmbedder';

export type DecodedImage = {pixels: Pixels; thumbnail: Buffer};

export interface ImageDecoder {
  // It rejects with ImageTooLargeError past the pixel ceiling, and with UnreadableFileError when
  // its library cannot read the bytes.
  decode(bytes: Buffer, contentType: ContentType): Promise<DecodedImage>;
}
