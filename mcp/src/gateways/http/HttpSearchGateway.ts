import type {GetMatchesRequest} from 'contract/GetMatchesRequest';
import type {GetMatchesResponse} from 'contract/GetMatchesResponse';
import type {SearchRequest} from 'contract/SearchRequest';
import type {SearchResponse} from 'contract/SearchResponse';
import type {SessionHeaders} from 'contract/SessionHeaders';
import type {SearchGateway, Thumbnail} from '../SearchGateway';
import {fetchJson} from './fetchJson';
import {fetchOrRefuse} from './fetchOrRefuse';

type ConstructorParams = {backendUrl: string; sessionHeaders: SessionHeaders};

export class HttpSearchGateway implements SearchGateway {
  private readonly backendUrl: string;
  private readonly sessionHeaders: SessionHeaders;

  public constructor({backendUrl, sessionHeaders}: ConstructorParams) {
    this.backendUrl = backendUrl;
    this.sessionHeaders = sessionHeaders;
  }

  public search(query: string): Promise<SearchResponse> {
    const request: SearchRequest = {q: query};

    return fetchJson<SearchResponse>(
      this.backendUrl,
      `/search?${new URLSearchParams(request)}`,
      this.sessionHeaders
    );
  }

  public matches(resourceId: string, query: string): Promise<GetMatchesResponse> {
    const request: GetMatchesRequest = {id: resourceId, q: query};

    return fetchJson<GetMatchesResponse>(
      this.backendUrl,
      `/resources/texts/${encodeURIComponent(request.id)}/matches?${new URLSearchParams({q: request.q})}`,
      this.sessionHeaders
    );
  }

  public async thumbnail(thumbnailUrl: string): Promise<Thumbnail> {
    const response = await fetchOrRefuse(
      this.backendUrl,
      thumbnailUrl,
      this.sessionHeaders
    );

    return {
      bytes: new Uint8Array(await response.arrayBuffer()),
      mediaType: mediaTypeOf(response)
    };
  }
}

const mediaTypeOf = (response: Response): string =>
  (response.headers.get('content-type') ?? 'application/octet-stream')
    .split(';')[0]
    .trim();
