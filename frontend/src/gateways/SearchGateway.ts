import type {GetMatchesResponse} from 'contract/GetMatchesResponse';
import type {SearchResponse} from 'contract/SearchResponse';

export interface SearchGateway {
  search(query: string): Promise<SearchResponse>;
  matches(resourceId: string, query: string): Promise<GetMatchesResponse>;
}
