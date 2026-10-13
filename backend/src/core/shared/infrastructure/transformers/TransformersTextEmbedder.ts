import {
  AutoModel,
  AutoTokenizer,
  mean_pooling,
  type PreTrainedModel,
  type PreTrainedTokenizer,
  Tensor
} from '@huggingface/transformers';
import type {
  ModelCallName,
  ModelCallRecorder
} from '../../domain/services/ModelCallRecorder';
import type {TextEmbedder} from '../../domain/services/TextEmbedder';
import {Vector} from '../../domain/value-objects/Vector';
import {readFromTheModelStore, refuseAMissingModel} from './modelStore';
import {type Count, RecordedModelCall} from './RecordedModelCall';
import {TEXT_MODEL} from './TextModel';
import {TokenWindows} from './TokenWindows';

type ConstructorParams = {
  tokenizer: PreTrainedTokenizer;
  model: PreTrainedModel;
  recorder: ModelCallRecorder;
};

type LoadParams = {recorder: ModelCallRecorder};

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
  private readonly recorder: ModelCallRecorder;

  private constructor({tokenizer, model, recorder}: ConstructorParams) {
    this.tokenizer = tokenizer;
    this.model = model;
    this.recorder = recorder;
  }

  public static async load({recorder}: LoadParams): Promise<TransformersTextEmbedder> {
    readFromTheModelStore();
    await refuseAMissingModel(TEXT_MODEL.repository);

    const [tokenizer, model] = await Promise.all([
      AutoTokenizer.from_pretrained(TEXT_MODEL.repository),
      AutoModel.from_pretrained(TEXT_MODEL.repository, {dtype: TEXT_MODEL.dtype})
    ]);

    return new TransformersTextEmbedder({tokenizer, model, recorder});
  }

  public embedChunk(text: string): Promise<Vector> {
    return this.embed('embed-chunk', PASSAGE_PREFIX, text);
  }

  public embedQuery(query: string): Promise<Vector> {
    return this.embed('embed-query', QUERY_PREFIX, query);
  }

  private embed(name: ModelCallName, prefix: string, text: string): Promise<Vector> {
    return RecordedModelCall.run({
      recorder: this.recorder,
      name,
      model: TEXT_MODEL,
      input: text,
      work: async (count: Count): Promise<Vector> => {
        const prefixIds = this.idsOf(prefix);
        const room = this.tokenizer.model_max_length - SPECIAL_TOKENS - prefixIds.length;
        const {bos_token_id: bos, eos_token_id: eos} = this.tokenizer;
        const inputs = TokenWindows.of(this.idsOf(text), room).map(window => [
          bos,
          ...prefixIds,
          ...window,
          eos
        ]);
        const windows: Tensor[] = [];

        count({input: inputs.reduce((sum, inputIds) => sum + inputIds.length, 0)});

        for (const inputIds of inputs) {
          windows.push(await this.embedWindow(inputIds));
        }

        return Vector.of({
          values: Array.from(TokenWindows.normalizedMeanOf(windows).data as Float32Array),
          model: TEXT_MODEL
        });
      }
    });
  }

  private idsOf(text: string): number[] {
    return this.tokenizer.encode(text, {add_special_tokens: false});
  }

  private async embedWindow(inputIds: readonly number[]): Promise<Tensor> {
    const attentionMask = int64TensorOf(inputIds.map(() => 1));
    const {last_hidden_state} = await this.model({
      input_ids: int64TensorOf(inputIds),
      attention_mask: attentionMask
    });

    return mean_pooling(last_hidden_state, attentionMask).normalize(2, -1);
  }
}
