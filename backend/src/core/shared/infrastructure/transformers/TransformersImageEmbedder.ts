import {
  AutoTokenizer,
  type PreTrainedModel,
  type PreTrainedTokenizer,
  SiglipTextModel,
  SiglipVisionModel
} from '@huggingface/transformers';
import {readFromTheModelStore, refuseAMissingModel} from './modelStore';
import {VISION_MODEL} from './VisionModel';

type ConstructorParams = {
  tokenizer: PreTrainedTokenizer;
  textTower: PreTrainedModel;
  visionTower: PreTrainedModel;
};

export class TransformersImageEmbedder {
  // @ts-expect-error TS6138: nothing reads the field yet.
  // biome-ignore lint/correctness/noUnusedPrivateClassMembers: embedQuery reads it, #67.
  private readonly tokenizer: PreTrainedTokenizer;
  // @ts-expect-error TS6138: nothing reads the field yet.
  // biome-ignore lint/correctness/noUnusedPrivateClassMembers: embedQuery reads it, #67.
  private readonly textTower: PreTrainedModel;
  // @ts-expect-error TS6138: nothing reads the field yet.
  // biome-ignore lint/correctness/noUnusedPrivateClassMembers: embedPicture reads it, #64.
  private readonly visionTower: PreTrainedModel;

  private constructor({tokenizer, textTower, visionTower}: ConstructorParams) {
    this.tokenizer = tokenizer;
    this.textTower = textTower;
    this.visionTower = visionTower;
  }

  public static async load(): Promise<TransformersImageEmbedder> {
    readFromTheModelStore();
    await refuseAMissingModel(VISION_MODEL.repository);

    const [tokenizer, textTower, visionTower] = await Promise.all([
      AutoTokenizer.from_pretrained(VISION_MODEL.repository),
      SiglipTextModel.from_pretrained(VISION_MODEL.repository, {
        dtype: VISION_MODEL.dtype
      }),
      SiglipVisionModel.from_pretrained(VISION_MODEL.repository, {
        dtype: VISION_MODEL.dtype
      })
    ]);

    return new TransformersImageEmbedder({tokenizer, textTower, visionTower});
  }
}
