import type {GetResourcesResponse} from 'contract/GetResourcesResponse';
import type {SessionHeaders} from 'contract/SessionHeaders';
import type {ResourceGateway} from '../ResourceGateway';
import {fetchJson} from './fetchJson';

type ConstructorParams = {backendUrl: string; sessionHeaders: SessionHeaders};

export class HttpResourceGateway implements ResourceGateway {
  private readonly backendUrl: string;
  private readonly sessionHeaders: SessionHeaders;

  public constructor({backendUrl, sessionHeaders}: ConstructorParams) {
    this.backendUrl = backendUrl;
    this.sessionHeaders = sessionHeaders;
  }

  public list(): Promise<GetResourcesResponse> {
    return fetchJson<GetResourcesResponse>(
      this.backendUrl,
      '/resources',
      this.sessionHeaders
    );
  }
}
