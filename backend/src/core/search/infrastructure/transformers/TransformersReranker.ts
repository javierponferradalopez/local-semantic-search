import {
  AutoModelForSequenceClassification,
  AutoTokenizer,
  type PreTrainedModel,
  type PreTrainedTokenizer,
  Tensor
} from '@huggingface/transformers';
import {
  readFromTheModelStore,
  refuseAMissingModel
} from '../../../shared/infrastructure/transformers/modelStore';
import type {Result} from '../../domain/Result';
import type {Reranker} from '../../domain/services/Reranker';
import {RerankerConfig} from './RerankerConfig';
import {RERANKER_MODEL} from './RerankerModel';

type ConstructorParams = {tokenizer: PreTrainedTokenizer; model: PreTrainedModel};

// The model was trained on 512 tokens. Its tokenizer says 32768, and its positions go to 8192.
const WALL_OF_TOKENS = 512;

// The tokenizer puts a pair as <s> Query </s></s> Chunk </s>.
const SPECIAL_TOKENS = 4;

const int64TensorOf = (values: readonly number[]): Tensor =>
  new Tensor('int64', BigInt64Array.from(values, BigInt), [1, values.length]);

// Longest first, the truncation_strategy of the config of the tokenizer.
const lengthsInTheRoom = (
  query: number,
  chunk: number,
  room: number
): [number, number] => {
  const half = Math.floor(room / 2);

  if (query + chunk <= room) {
    return [query, chunk];
  }

  if (query <= half) {
    return [query, room - query];
  }

  if (chunk <= half) {
    return [room - chunk, chunk];
  }

  return [room - half, half];
};

export class TransformersReranker implements Reranker {
  private readonly tokenizer: PreTrainedTokenizer;
  private readonly model: PreTrainedModel;

  private constructor({tokenizer, model}: ConstructorParams) {
    this.tokenizer = tokenizer;
    this.model = model;
  }

  public static async load(): Promise<TransformersReranker> {
    readFromTheModelStore();
    await refuseAMissingModel(RERANKER_MODEL.repository);

    const [tokenizer, config] = await Promise.all([
      AutoTokenizer.from_pretrained(RERANKER_MODEL.repository),
      RerankerConfig.load()
    ]);
    const model = await AutoModelForSequenceClassification.from_pretrained(
      RERANKER_MODEL.repository,
      {dtype: RERANKER_MODEL.dtype, config}
    );

    return new TransformersReranker({tokenizer, model});
  }

  // One pair for each call: a padded batch is 2.7 times slower (ADR-0040).
  public async rerank(query: string, results: readonly Result[]): Promise<Result[]> {
    const queryIds = this.idsOf(query);
    const reranked: Result[] = [];

    for (const result of results) {
      const score = await this.scoreOf(queryIds, this.idsOf(result.bestMatch.text));

      reranked.push({...result, bestMatch: {...result.bestMatch, score}});
    }

    return reranked.sort(
      (first, second) => second.bestMatch.score - first.bestMatch.score
    );
  }

  private idsOf(text: string): number[] {
    return this.tokenizer.encode(text, {add_special_tokens: false});
  }

  // The cut changes only a score and stores nothing, so ADR-0014 does not apply.
  private async scoreOf(queryIds: number[], chunkIds: number[]): Promise<number> {
    const {bos_token_id: bos, eos_token_id: eos} = this.tokenizer;
    const [queryLength, chunkLength] = lengthsInTheRoom(
      queryIds.length,
      chunkIds.length,
      WALL_OF_TOKENS - SPECIAL_TOKENS
    );
    const inputIds = [
      bos,
      ...queryIds.slice(0, queryLength),
      eos,
      eos,
      ...chunkIds.slice(0, chunkLength),
      eos
    ];
    const {logits} = (await this.model({
      input_ids: int64TensorOf(inputIds),
      attention_mask: int64TensorOf(inputIds.map(() => 1))
    })) as {logits: Tensor};

    return (logits.data as Float32Array)[0];
  }
}
