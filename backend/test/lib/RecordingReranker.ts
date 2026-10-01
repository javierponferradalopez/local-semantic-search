import type {Result} from '../../src/core/search/domain/Result';
import type {Reranker} from '../../src/core/search/domain/services/Reranker';

type ConstructorParams = {reranker: Reranker};

export type Reranking = {firstStage: readonly Result[]; reranked: readonly Result[]};

// The eval reads the first stage here, so the production code does not change for it.
export class RecordingReranker implements Reranker {
  private readonly reranker: Reranker;
  private lastReranking: Reranking | undefined;

  public constructor({reranker}: ConstructorParams) {
    this.reranker = reranker;
  }

  public async rerank(query: string, results: readonly Result[]): Promise<Result[]> {
    const reranked = await this.reranker.rerank(query, results);

    this.lastReranking = {firstStage: results, reranked};

    return reranked;
  }

  // Undefined when the last Search did not get a Reranking.
  public takeTheLastReranking(): Reranking | undefined {
    const reranking = this.lastReranking;

    this.lastReranking = undefined;

    return reranking;
  }
}
