import type {ContentType} from 'contract/ContentType';
import type {TextExtractor} from '../domain/TextExtractor';

export class ContentTypeTextExtractor implements TextExtractor {
  private readonly decoder = new TextDecoder('utf-8');

  public async extract(bytes: Buffer, contentType: ContentType): Promise<string[]> {
    if (contentType !== 'plain_text') {
      throw new Error(`The extraction of the Content type ${contentType} is not built`);
    }

    return [this.decoder.decode(bytes)];
  }
}
