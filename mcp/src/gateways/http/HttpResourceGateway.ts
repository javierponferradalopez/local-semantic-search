import type {GetResourcesResponse} from 'contract/GetResourcesResponse';
import type {ResourceGateway} from '../ResourceGateway';
import {fetchJson} from './fetchJson';

export class HttpResourceGateway implements ResourceGateway {
  private readonly backendUrl: string;

  public constructor({backendUrl}: {backendUrl: string}) {
    this.backendUrl = backendUrl;
  }

  public list(): Promise<GetResourcesResponse> {
    return fetchJson<GetResourcesResponse>(this.backendUrl, '/resources');
  }
}
