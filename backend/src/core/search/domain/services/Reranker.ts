import type {Result} from '../Result';

// It knows no Floor: the gate stays in Search (ADR-0040).
export interface Reranker {
  // The same Results, with the score of the Reranker on their best Match, best first.
  rerank(query: string, results: readonly Result[]): Promise<Result[]>;
}
