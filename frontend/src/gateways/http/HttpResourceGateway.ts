import {CreateTextResourceRequest} from 'contract/CreateTextResourceRequest';
import type {CreateTextResourceResponse} from 'contract/CreateTextResourceResponse';
import type {GetResourcesResponse} from 'contract/GetResourcesResponse';
import {fetchJson} from '@/gateways/http/fetchJson';
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
}
