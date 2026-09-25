import {
  AutoModel,
  AutoTokenizer,
  mean_pooling,
  type PreTrainedModel,
  type PreTrainedTokenizer
} from '@huggingface/transformers';
import type {TextEmbedder} from '../../domain/services/TextEmbedder';
import {Vector} from '../../domain/value-objects/Vector';
import {readFromTheModelStore, refuseAMissingModel} from './modelStore';
import {TEXT_MODEL} from './TextModel';

type ConstructorParams = {tokenizer: PreTrainedTokenizer; model: PreTrainedModel};

// E5 was trained with these prefixes. They stay here, and the domain never names them.
const PASSAGE_PREFIX = 'passage: ';
const QUERY_PREFIX = 'query: ';

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
    return this.embed(`${PASSAGE_PREFIX}${text}`);
  }

  public embedQuery(query: string): Promise<Vector> {
    return this.embed(`${QUERY_PREFIX}${query}`);
  }

  // No truncation: it drops text, and a Ready row would then lie (ADR-0014).
  private async embed(text: string): Promise<Vector> {
    const inputs = this.tokenizer(text);
    const {last_hidden_state} = await this.model(inputs);
    const pooled = mean_pooling(last_hidden_state, inputs.attention_mask).normalize(
      2,
      -1
    );

    return Vector.of({
      values: Array.from(pooled.data as Float32Array),
      model: TEXT_MODEL
    });
  }
}
