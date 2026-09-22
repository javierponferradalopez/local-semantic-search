import type {IngestState} from './IngestState';

type DuplicateResource = {
  code: 'duplicate_resource';
  params: {resourceId: string; name: string; ingestState: IngestState};
};

export type ErrorItem = DuplicateResource;
