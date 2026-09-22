export const INGEST_STATES = ['ingesting', 'ready', 'failed'] as const;

export type IngestState = (typeof INGEST_STATES)[number];
