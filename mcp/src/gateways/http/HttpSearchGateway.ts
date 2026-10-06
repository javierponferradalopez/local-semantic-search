import type {GetMatchesRequest} from 'contract/GetMatchesRequest';
import type {GetMatchesResponse} from 'contract/GetMatchesResponse';
import type {SearchRequest} from 'contract/SearchRequest';
import type {SearchResponse} from 'contract/SearchResponse';
import type {SearchGateway, Thumbnail} from '../SearchGateway';
import {fetchJson} from './fetchJson';
import {fetchOrRefuse} from './fetchOrRefuse';

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

  public matches(resourceId: string, query: string): Promise<GetMatchesResponse> {
    const request: GetMatchesRequest = {id: resourceId, q: query};

    return fetchJson<GetMatchesResponse>(
      this.backendUrl,
      `/resources/texts/${encodeURIComponent(request.id)}/matches?${new URLSearchParams({q: request.q})}`
    );
  }

  public async thumbnail(thumbnailUrl: string): Promise<Thumbnail> {
    const response = await fetchOrRefuse(this.backendUrl, thumbnailUrl);

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
