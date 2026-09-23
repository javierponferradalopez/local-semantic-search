import type {CreateTextResourceResponse} from 'contract/CreateTextResourceResponse';
import type {GetResourcesResponse} from 'contract/GetResourcesResponse';

export interface ResourceGateway {
  list(): Promise<GetResourcesResponse>;
  createTextResource(file: File): Promise<CreateTextResourceResponse>;
}
