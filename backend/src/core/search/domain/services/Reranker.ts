import type {Match} from '../Match';
import type {Result} from '../Result';

// It knows no Floor: the Floor stays in the use cases (ADR-0040).
export interface Reranker {
  // The same Results, with the score of the Reranker on their best Match, best first.
  rerank(query: string, results: readonly Result[]): Promise<Result[]>;
  // The same Matches of one Resource, with the score of the Reranker, best first.
  rerankMatches(query: string, matches: readonly Match[]): Promise<Match[]>;
}
