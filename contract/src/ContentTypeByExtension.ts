import type {ContentType} from './ContentType';

export const CONTENT_TYPE_BY_EXTENSION: ReadonlyMap<string, ContentType> = new Map([
  ['.pdf', 'pdf'],
  ['.txt', 'plain_text'],
  ['.md', 'markdown']
]);
