import type {GetMatchesRequest} from 'contract/GetMatchesRequest';
import type {GetMatchesResponse} from 'contract/GetMatchesResponse';
import type {SearchRequest} from 'contract/SearchRequest';
import type {SearchResponse} from 'contract/SearchResponse';
import type {SessionHeaders} from 'contract/SessionHeaders';
import {fetchJson} from '@/gateways/http/fetchJson';
import type {SearchGateway} from '@/gateways/SearchGateway';

type ConstructorParams = {sessionHeaders: SessionHeaders};

export class HttpSearchGateway implements SearchGateway {
  private readonly sessionHeaders: SessionHeaders;

  public constructor({sessionHeaders}: ConstructorParams) {
    this.sessionHeaders = sessionHeaders;
  }

  public search(query: string): Promise<SearchResponse> {
    const request: SearchRequest = {q: query};

    return fetchJson<SearchResponse>(
      `/search?${new URLSearchParams(request)}`,
      this.sessionHeaders
    );
  }

  public matches(resourceId: string, query: string): Promise<GetMatchesResponse> {
    const request: GetMatchesRequest = {id: resourceId, q: query};

    return fetchJson<GetMatchesResponse>(
      `/resources/texts/${encodeURIComponent(request.id)}/matches?${new URLSearchParams({q: request.q})}`,
      this.sessionHeaders
    );
  }
}
