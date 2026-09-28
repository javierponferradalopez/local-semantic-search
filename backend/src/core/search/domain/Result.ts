import type {ContentType} from 'contract/ContentType';
import type {Match} from './Match';

export type Result = {
  resourceId: string;
  name: string;
  contentType: ContentType;
  fileKey: string;
  bestMatch: Match;
};
