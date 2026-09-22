export const CONTENT_TYPES = ['pdf', 'plain_text', 'markdown'] as const;

export type ContentType = (typeof CONTENT_TYPES)[number];
