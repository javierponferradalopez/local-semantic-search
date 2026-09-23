import type {IngestState} from 'contract/IngestState';

const TEXT_BY_INGEST_STATE: Record<IngestState, string> = {
  ingesting: 'Ingesting',
  ready: 'Ready',
  failed: 'Failed'
};

export const textOfIngestState = (ingestState: IngestState): string =>
  TEXT_BY_INGEST_STATE[ingestState];
