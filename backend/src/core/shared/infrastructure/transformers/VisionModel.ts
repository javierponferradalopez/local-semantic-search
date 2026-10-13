export const VISION_MODEL = {
  repository: 'onnx-community/siglip2-base-patch16-224-ONNX',
  dtype: 'fp32',
  width: 768,
  floor: 0.09,
  margin: 0.02,
  // voyage-multimodal-3.5, $0.60 for 1B pixels (a Picture is 224 × 224 pixels) and $0.12
  // for 1M tokens: https://docs.voyageai.com/docs/pricing (ADR-0049).
  price: {image: 0.0000301, input: 0.00000012}
} as const;
