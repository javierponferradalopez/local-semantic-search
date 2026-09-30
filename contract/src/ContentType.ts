export const TEXT_CONTENT_TYPES = ['pdf', 'plain_text', 'markdown'] as const;

export const IMAGE_CONTENT_TYPES = ['jpeg', 'png', 'webp', 'gif', 'avif', 'svg'] as const;

export const CONTENT_TYPES = [...TEXT_CONTENT_TYPES, ...IMAGE_CONTENT_TYPES] as const;

export type TextContentType = (typeof TEXT_CONTENT_TYPES)[number];

export type ImageContentType = (typeof IMAGE_CONTENT_TYPES)[number];

export type ContentType = TextContentType | ImageContentType;

export const isAnImageContentType = (value: string): value is ImageContentType =>
  IMAGE_CONTENT_TYPES.some(contentType => contentType === value);
