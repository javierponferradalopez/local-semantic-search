import {
  AutoImageProcessor,
  AutoTokenizer,
  type ImageProcessor,
  type PreTrainedModel,
  type PreTrainedTokenizer,
  RawImage,
  SiglipTextModel,
  SiglipVisionModel,
  type Tensor
} from '@huggingface/transformers';
import type {ImageEmbedder, Pixels} from '../../domain/services/ImageEmbedder';
import {Vector} from '../../domain/value-objects/Vector';
import {readFromTheModelStore, refuseAMissingModel} from './modelStore';
import {VISION_MODEL} from './VisionModel';

type ConstructorParams = {
  tokenizer: PreTrainedTokenizer;
  imageProcessor: ImageProcessor;
  textTower: PreTrainedModel;
  visionTower: PreTrainedModel;
};

export class TransformersImageEmbedder implements ImageEmbedder {
  // @ts-expect-error TS6138: nothing reads the field yet.
  // biome-ignore lint/correctness/noUnusedPrivateClassMembers: embedQuery reads it, #67.
  private readonly tokenizer: PreTrainedTokenizer;
  private readonly imageProcessor: ImageProcessor;
  // @ts-expect-error TS6138: nothing reads the field yet.
  // biome-ignore lint/correctness/noUnusedPrivateClassMembers: embedQuery reads it, #67.
  private readonly textTower: PreTrainedModel;
  private readonly visionTower: PreTrainedModel;

  private constructor({
    tokenizer,
    imageProcessor,
    textTower,
    visionTower
  }: ConstructorParams) {
    this.tokenizer = tokenizer;
    this.imageProcessor = imageProcessor;
    this.textTower = textTower;
    this.visionTower = visionTower;
  }

  public static async load(): Promise<TransformersImageEmbedder> {
    readFromTheModelStore();
    await refuseAMissingModel(VISION_MODEL.repository);

    const [tokenizer, imageProcessor, textTower, visionTower] = await Promise.all([
      AutoTokenizer.from_pretrained(VISION_MODEL.repository),
      AutoImageProcessor.from_pretrained(VISION_MODEL.repository),
      SiglipTextModel.from_pretrained(VISION_MODEL.repository, {
        dtype: VISION_MODEL.dtype
      }),
      SiglipVisionModel.from_pretrained(VISION_MODEL.repository, {
        dtype: VISION_MODEL.dtype
      })
    ]);

    return new TransformersImageEmbedder({
      tokenizer,
      imageProcessor,
      textTower,
      visionTower
    });
  }

  public async embedPicture({data, width, height, channels}: Pixels): Promise<Vector> {
    const inputs = await this.imageProcessor(new RawImage(data, width, height, channels));
    const {pooler_output} = (await this.visionTower(inputs)) as {pooler_output: Tensor};

    return Vector.of({
      values: Array.from(pooler_output.normalize(2, -1).data as Float32Array),
      model: VISION_MODEL
    });
  }

  public embedQuery(): Promise<Vector> {
    return Promise.reject(new Error('The Vision model embeds no Query yet, #67'));
  }
}
