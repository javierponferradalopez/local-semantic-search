import type {SearchRequest} from 'contract/SearchRequest';
import type {SearchResponse} from 'contract/SearchResponse';
import type {SearchGateway} from '../SearchGateway';
import {fetchJson} from './fetchJson';

export class HttpSearchGateway implements SearchGateway {
  private readonly backendUrl: string;

  public constructor({backendUrl}: {backendUrl: string}) {
    this.backendUrl = backendUrl;
  }

  public search(query: string): Promise<SearchResponse> {
    const request: SearchRequest = {q: query};

    return fetchJson<SearchResponse>(
      this.backendUrl,
      `/search?${new URLSearchParams(request)}`
    );
  }
}
