import type {GetMatchesResponse} from 'contract/GetMatchesResponse';
import type {SearchResponse} from 'contract/SearchResponse';

export type Thumbnail = {bytes: Uint8Array; mediaType: string};

export interface SearchGateway {
  search(query: string): Promise<SearchResponse>;
  matches(resourceId: string, query: string): Promise<GetMatchesResponse>;
  thumbnail(thumbnailUrl: string): Promise<Thumbnail>;
}
