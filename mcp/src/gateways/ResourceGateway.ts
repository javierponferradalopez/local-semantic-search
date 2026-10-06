import type {GetResourcesResponse} from 'contract/GetResourcesResponse';

export interface ResourceGateway {
  list(): Promise<GetResourcesResponse>;
}
