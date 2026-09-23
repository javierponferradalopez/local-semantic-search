import type {ListedResource} from './ListedResource';

export interface ResourceReader {
  getNewestFirst(): Promise<ListedResource[]>;
}
