export const RERANKER_MODEL = {
  repository: 'onnx-community/gte-multilingual-reranker-base',
  // q8, not fp32 as the other models, and the Floor is measured on q8 (ADR-0040).
  dtype: 'q8',
  // 4.3.0 does not know model_type `new`. This value selects only the class that feeds the graph.
  config: {model_type: 'xlm-roberta'},
  floor: -0.58
} as const;
