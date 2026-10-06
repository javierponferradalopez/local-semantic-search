import type {SearchResponse} from 'contract/SearchResponse';

export interface SearchGateway {
  search(query: string): Promise<SearchResponse>;
}
