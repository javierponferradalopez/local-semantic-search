import {
  AutoModel,
  AutoTokenizer,
  mean_pooling,
  type PreTrainedModel,
  type PreTrainedTokenizer,
  Tensor
} from '@huggingface/transformers';
import type {TextEmbedder} from '../../domain/services/TextEmbedder';
import {Vector} from '../../domain/value-objects/Vector';
import {readFromTheModelStore, refuseAMissingModel} from './modelStore';
import {TEXT_MODEL} from './TextModel';
import {TokenWindows} from './TokenWindows';

type ConstructorParams = {tokenizer: PreTrainedTokenizer; model: PreTrainedModel};

// E5 was trained with these prefixes. They stay here, and the domain never names them.
// No space ends them: the tokenizer gives that space to the first word of the text.
const PASSAGE_PREFIX = 'passage:';
const QUERY_PREFIX = 'query:';

// The tokenizer puts each input between <s> and </s>.
const SPECIAL_TOKENS = 2;

const int64TensorOf = (values: readonly number[]): Tensor =>
  new Tensor('int64', BigInt64Array.from(values, BigInt), [1, values.length]);

export class TransformersTextEmbedder implements TextEmbedder {
  private readonly tokenizer: PreTrainedTokenizer;
  private readonly model: PreTrainedModel;

  private constructor({tokenizer, model}: ConstructorParams) {
    this.tokenizer = tokenizer;
    this.model = model;
  }

  public static async load(): Promise<TransformersTextEmbedder> {
    readFromTheModelStore();
    await refuseAMissingModel(TEXT_MODEL.repository);

    const [tokenizer, model] = await Promise.all([
      AutoTokenizer.from_pretrained(TEXT_MODEL.repository),
      AutoModel.from_pretrained(TEXT_MODEL.repository, {dtype: TEXT_MODEL.dtype})
    ]);

    return new TransformersTextEmbedder({tokenizer, model});
  }

  public embedChunk(text: string): Promise<Vector> {
    return this.embed(PASSAGE_PREFIX, text);
  }

  public embedQuery(query: string): Promise<Vector> {
    return this.embed(QUERY_PREFIX, query);
  }

  private async embed(prefix: string, text: string): Promise<Vector> {
    const prefixIds = this.idsOf(prefix);
    const room = this.tokenizer.model_max_length - SPECIAL_TOKENS - prefixIds.length;
    const windows: Tensor[] = [];

    for (const window of TokenWindows.of(this.idsOf(text), room)) {
      windows.push(await this.embedWindow([...prefixIds, ...window]));
    }

    return Vector.of({
      values: Array.from(TokenWindows.normalizedMeanOf(windows).data as Float32Array),
      model: TEXT_MODEL
    });
  }

  private idsOf(text: string): number[] {
    return this.tokenizer.encode(text, {add_special_tokens: false});
  }

  private async embedWindow(ids: readonly number[]): Promise<Tensor> {
    const inputIds = [this.tokenizer.bos_token_id, ...ids, this.tokenizer.eos_token_id];
    const attentionMask = int64TensorOf(inputIds.map(() => 1));
    const {last_hidden_state} = await this.model({
      input_ids: int64TensorOf(inputIds),
      attention_mask: attentionMask
    });

    return mean_pooling(last_hidden_state, attentionMask).normalize(2, -1);
  }
}
