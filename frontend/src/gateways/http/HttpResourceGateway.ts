import {CreateImageResourceRequest} from 'contract/CreateImageResourceRequest';
import type {CreateImageResourceResponse} from 'contract/CreateImageResourceResponse';
import {CreateTextResourceRequest} from 'contract/CreateTextResourceRequest';
import type {CreateTextResourceResponse} from 'contract/CreateTextResourceResponse';
import type {GetResourcesResponse} from 'contract/GetResourcesResponse';
import type {RetryImageResourceResponse} from 'contract/RetryImageResourceResponse';
import type {RetryTextResourceResponse} from 'contract/RetryTextResourceResponse';
import type {SessionHeaders} from 'contract/SessionHeaders';
import {fetchJson} from '@/gateways/http/fetchJson';
import {fetchOrRefuse} from '@/gateways/http/fetchOrRefuse';
import type {ResourceGateway} from '@/gateways/ResourceGateway';

type ConstructorParams = {sessionHeaders: SessionHeaders};

export class HttpResourceGateway implements ResourceGateway {
  private readonly sessionHeaders: SessionHeaders;

  public constructor({sessionHeaders}: ConstructorParams) {
    this.sessionHeaders = sessionHeaders;
  }

  public list(): Promise<GetResourcesResponse> {
    return fetchJson<GetResourcesResponse>('/resources', this.sessionHeaders);
  }

  public createTextResource(file: File): Promise<CreateTextResourceResponse> {
    const body = new FormData();

    body.append(CreateTextResourceRequest.filePart, file);

    return fetchJson<CreateTextResourceResponse>(
      '/resources/texts',
      this.sessionHeaders,
      {method: 'POST', body}
    );
  }

  public createImageResource(file: File): Promise<CreateImageResourceResponse> {
    const body = new FormData();

    body.append(CreateImageResourceRequest.filePart, file);

    return fetchJson<CreateImageResourceResponse>(
      '/resources/images',
      this.sessionHeaders,
      {method: 'POST', body}
    );
  }

  public async deleteTextResource(id: string): Promise<void> {
    await fetchOrRefuse(
      `/resources/texts/${encodeURIComponent(id)}`,
      this.sessionHeaders,
      {method: 'DELETE'}
    );
  }

  public async deleteImageResource(id: string): Promise<void> {
    await fetchOrRefuse(
      `/resources/images/${encodeURIComponent(id)}`,
      this.sessionHeaders,
      {method: 'DELETE'}
    );
  }

  public retryTextResource(id: string): Promise<RetryTextResourceResponse> {
    return fetchJson<RetryTextResourceResponse>(
      `/resources/texts/${encodeURIComponent(id)}/retry`,
      this.sessionHeaders,
      {method: 'POST'}
    );
  }

  public retryImageResource(id: string): Promise<RetryImageResourceResponse> {
    return fetchJson<RetryImageResourceResponse>(
      `/resources/images/${encodeURIComponent(id)}/retry`,
      this.sessionHeaders,
      {method: 'POST'}
    );
  }
}
