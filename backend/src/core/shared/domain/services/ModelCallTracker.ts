import type {Pixels} from './ImageEmbedder';

export type ModelCallName =
  | 'embed-chunk'
  | 'embed-picture'
  | 'embed-query'
  | 'rerank'
  | 'rerank-matches';

export type Usage = {input?: number; image?: number; pairs?: number};

export type ModelCall = {
  name: ModelCallName;
  model: {repository: string; dtype: string};
  usage: Usage;
  input: string | Pixels | {query: string; texts: readonly string[]};
  // Only the Reranker gives an output: its scores, in the order of its pairs. No Vector.
  output?: readonly number[];
  startTime: Date;
  endTime: Date;
  error?: unknown;
};

export interface ModelCallTracker {
  // Never throws: the tracking is information about the work, and never breaks it (ADR-0048).
  track(call: ModelCall): void;
}
