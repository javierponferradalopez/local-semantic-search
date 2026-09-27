import type {ReasonCode} from 'contract/ReasonCode';

const TEXT_BY_REASON: Record<ReasonCode, string> = {
  no_text_found: 'No text was found in this file.',
  image_too_large: 'The image is too large.',
  unreadable_file: 'The file could not be read.',
  ingest_error: 'Something went wrong.'
};

export const textOfReason = (reason: ReasonCode): string => TEXT_BY_REASON[reason];
