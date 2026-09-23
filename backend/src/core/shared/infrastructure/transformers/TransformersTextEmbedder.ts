import {
  AutoModel,
  AutoTokenizer,
  type PreTrainedModel,
  type PreTrainedTokenizer
} from '@huggingface/transformers';
import {readFromTheModelStore, refuseAMissingModel} from './modelStore';
import {TEXT_MODEL} from './TextModel';

type ConstructorParams = {tokenizer: PreTrainedTokenizer; model: PreTrainedModel};

export class TransformersTextEmbedder {
  // @ts-expect-error TS6133: the operations of the port arrive with the slice that embeds
  // biome-ignore lint/correctness/noUnusedPrivateClassMembers: the operations of the port read it
  private readonly tokenizer: PreTrainedTokenizer;
  // @ts-expect-error TS6133: the operations of the port arrive with the slice that embeds
  // biome-ignore lint/correctness/noUnusedPrivateClassMembers: the operations of the port read it
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
}
