export const TEXT_MODEL = {
  repository: 'intfloat/multilingual-e5-small',
  dtype: 'fp32',
  width: 384,
  // voyage-4-lite, $0.02 for 1M tokens: https://docs.voyageai.com/docs/pricing (ADR-0049).
  price: {input: 0.00000002}
} as const;
