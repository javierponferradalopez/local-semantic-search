import type {SearchResponse} from 'contract/SearchResponse';

export type Thumbnail = {bytes: Uint8Array; mediaType: string};

export interface SearchGateway {
  search(query: string): Promise<SearchResponse>;
  thumbnail(thumbnailUrl: string): Promise<Thumbnail>;
}
