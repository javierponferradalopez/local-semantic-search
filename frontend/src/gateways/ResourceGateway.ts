import type {CreateImageResourceResponse} from 'contract/CreateImageResourceResponse';
import type {CreateTextResourceResponse} from 'contract/CreateTextResourceResponse';
import type {GetResourcesResponse} from 'contract/GetResourcesResponse';
import type {RetryTextResourceResponse} from 'contract/RetryTextResourceResponse';

export interface ResourceGateway {
  list(): Promise<GetResourcesResponse>;
  createTextResource(file: File): Promise<CreateTextResourceResponse>;
  createImageResource(file: File): Promise<CreateImageResourceResponse>;
  deleteTextResource(id: string): Promise<void>;
  deleteImageResource(id: string): Promise<void>;
  retryTextResource(id: string): Promise<RetryTextResourceResponse>;
}
