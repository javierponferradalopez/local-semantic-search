export const REASON_CODES = [
  'no_text_found',
  'image_too_large',
  'unreadable_file',
  'ingest_error'
] as const;

export type ReasonCode = (typeof REASON_CODES)[number];
