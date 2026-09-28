import type {SearchRequest} from 'contract/SearchRequest';
import type {SearchResponse} from 'contract/SearchResponse';
import {fetchJson} from '@/gateways/http/fetchJson';
import type {SearchGateway} from '@/gateways/SearchGateway';

export class HttpSearchGateway implements SearchGateway {
  public search(query: string): Promise<SearchResponse> {
    const request: SearchRequest = {q: query};

    return fetchJson<SearchResponse>(`/search?${new URLSearchParams(request)}`);
  }
}
