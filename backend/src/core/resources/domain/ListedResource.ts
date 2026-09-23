import type {ContentType} from 'contract/ContentType';
import type {IngestState} from 'contract/IngestState';
import type {ReasonCode} from 'contract/ReasonCode';

export type ListedResource = {
  id: string;
  name: string;
  contentType: ContentType;
  ingestState: IngestState;
  reason?: ReasonCode;
  createdAt: string;
  fileKey: string;
};
