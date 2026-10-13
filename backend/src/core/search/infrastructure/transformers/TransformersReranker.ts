import {
  AutoModelForSequenceClassification,
  AutoTokenizer,
  type PreTrainedModel,
  type PreTrainedTokenizer,
  Tensor
} from '@huggingface/transformers';
import type {
  ModelCallName,
  ModelCallRecorder
} from '../../../shared/domain/services/ModelCallRecorder';
import {
  readFromTheModelStore,
  refuseAMissingModel
} from '../../../shared/infrastructure/transformers/modelStore';
import {
  type Count,
  RecordedModelCall
} from '../../../shared/infrastructure/transformers/RecordedModelCall';
import type {Match} from '../../domain/Match';
import type {Result} from '../../domain/Result';
import type {Reranker} from '../../domain/services/Reranker';
import {RerankerConfig} from './RerankerConfig';
import {RERANKER_MODEL} from './RerankerModel';

type ConstructorParams = {
  tokenizer: PreTrainedTokenizer;
  model: PreTrainedModel;
  recorder: ModelCallRecorder;
};

type LoadParams = {recorder: ModelCallRecorder};

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
  private readonly recorder: ModelCallRecorder;

  private constructor({tokenizer, model, recorder}: ConstructorParams) {
    this.tokenizer = tokenizer;
    this.model = model;
    this.recorder = recorder;
  }

  public static async load({recorder}: LoadParams): Promise<TransformersReranker> {
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

    return new TransformersReranker({tokenizer, model, recorder});
  }

  public async rerank(query: string, results: readonly Result[]): Promise<Result[]> {
    const scores = await this.scoresOf(
      'rerank',
      query,
      results.map(result => result.bestMatch.text)
    );

    return results
      .map((result, index) => ({
        ...result,
        bestMatch: {...result.bestMatch, score: scores[index]}
      }))
      .sort((first, second) => second.bestMatch.score - first.bestMatch.score);
  }

  public async rerankMatches(query: string, matches: readonly Match[]): Promise<Match[]> {
    const scores = await this.scoresOf(
      'rerank-matches',
      query,
      matches.map(match => match.text)
    );

    return matches
      .map((match, index) => ({...match, score: scores[index]}))
      .sort((first, second) => second.score - first.score);
  }

  private scoresOf(
    name: ModelCallName,
    query: string,
    texts: readonly string[]
  ): Promise<number[]> {
    // With no pair, the model does not run, so there is no Model call to record.
    if (texts.length === 0) {
      return Promise.resolve([]);
    }

    return RecordedModelCall.run({
      recorder: this.recorder,
      name,
      model: RERANKER_MODEL,
      input: {query, texts},
      outputOf: (scores: number[]): number[] => scores,
      work: async (count: Count): Promise<number[]> => {
        const queryIds = this.idsOf(query);
        const pairs = texts.map(text => this.pairOf(queryIds, this.idsOf(text)));
        const scores: number[] = [];

        count({
          pairs: pairs.length,
          input: pairs.reduce((sum, inputIds) => sum + inputIds.length, 0)
        });

        // One pair for each call: a padded batch is 2.7 times slower (ADR-0040).
        for (const inputIds of pairs) {
          scores.push(await this.scoreOf(inputIds));
        }

        return scores;
      }
    });
  }

  private idsOf(text: string): number[] {
    return this.tokenizer.encode(text, {add_special_tokens: false});
  }

  // The cut changes only a score and stores nothing, so ADR-0014 does not apply.
  private pairOf(queryIds: readonly number[], chunkIds: readonly number[]): number[] {
    const {bos_token_id: bos, eos_token_id: eos} = this.tokenizer;
    const [queryLength, chunkLength] = lengthsInTheRoom(
      queryIds.length,
      chunkIds.length,
      WALL_OF_TOKENS - SPECIAL_TOKENS
    );

    return [
      bos,
      ...queryIds.slice(0, queryLength),
      eos,
      eos,
      ...chunkIds.slice(0, chunkLength),
      eos
    ];
  }

  private async scoreOf(inputIds: readonly number[]): Promise<number> {
    const {logits} = (await this.model({
      input_ids: int64TensorOf(inputIds),
      attention_mask: int64TensorOf(inputIds.map(() => 1))
    })) as {logits: Tensor};

    return (logits.data as Float32Array)[0];
  }
}
