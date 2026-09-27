import {CreateTextResourceRequest} from 'contract/CreateTextResourceRequest';
import type {CreateTextResourceResponse} from 'contract/CreateTextResourceResponse';
import type {GetResourcesResponse} from 'contract/GetResourcesResponse';
import type {RetryTextResourceResponse} from 'contract/RetryTextResourceResponse';
import {fetchJson} from '@/gateways/http/fetchJson';
import {fetchOrRefuse} from '@/gateways/http/fetchOrRefuse';
import type {ResourceGateway} from '@/gateways/ResourceGateway';

export class HttpResourceGateway implements ResourceGateway {
  public list(): Promise<GetResourcesResponse> {
    return fetchJson<GetResourcesResponse>('/resources');
  }

  public createTextResource(file: File): Promise<CreateTextResourceResponse> {
    const body = new FormData();

    body.append(CreateTextResourceRequest.filePart, file);

    return fetchJson<CreateTextResourceResponse>('/resources/texts', {
      method: 'POST',
      body
    });
  }

  public async deleteTextResource(id: string): Promise<void> {
    await fetchOrRefuse(`/resources/texts/${encodeURIComponent(id)}`, {method: 'DELETE'});
  }

  public retryTextResource(id: string): Promise<RetryTextResourceResponse> {
    return fetchJson<RetryTextResourceResponse>(
      `/resources/texts/${encodeURIComponent(id)}/retry`,
      {method: 'POST'}
    );
  }
}
