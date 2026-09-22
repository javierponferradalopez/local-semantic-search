import type {ContentType} from './ContentType';
import type {IngestState} from './IngestState';
import type {ReasonCode} from './ReasonCode';

export type ResourceRow = {
  id: string;
  name: string;
  contentType: ContentType;
  ingestState: IngestState;
  reason?: ReasonCode;
  createdAt: string;
  fileUrl: string;
};
