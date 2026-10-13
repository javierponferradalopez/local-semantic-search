import {
  AutoImageProcessor,
  AutoTokenizer,
  type ImageProcessor,
  type PreTrainedModel,
  type PreTrainedTokenizer,
  RawImage,
  SiglipTextModel,
  SiglipVisionModel,
  Tensor
} from '@huggingface/transformers';
import type {ImageEmbedder, Pixels} from '../../domain/services/ImageEmbedder';
import type {ModelCallRecorder} from '../../domain/services/ModelCallRecorder';
import {Vector} from '../../domain/value-objects/Vector';
import {readFromTheModelStore, refuseAMissingModel} from './modelStore';
import {type Count, RecordedModelCall} from './RecordedModelCall';
import {TokenWindows} from './TokenWindows';
import {VISION_MODEL} from './VisionModel';

// The text tower was trained on 64 tokens. The model_max_length of the tokenizer does not say it.
const WALL_OF_TOKENS = 64;

// The tokenizer ends each input with <eos>.
const SPECIAL_TOKENS = 1;

const int64TensorOf = (values: readonly number[]): Tensor =>
  new Tensor('int64', BigInt64Array.from(values, BigInt), [1, values.length]);

type ConstructorParams = {
  tokenizer: PreTrainedTokenizer;
  imageProcessor: ImageProcessor;
  textTower: PreTrainedModel;
  visionTower: PreTrainedModel;
  recorder: ModelCallRecorder;
};

type LoadParams = {recorder: ModelCallRecorder};

export class TransformersImageEmbedder implements ImageEmbedder {
  private readonly tokenizer: PreTrainedTokenizer;
  private readonly imageProcessor: ImageProcessor;
  private readonly textTower: PreTrainedModel;
  private readonly visionTower: PreTrainedModel;
  private readonly recorder: ModelCallRecorder;

  private constructor({
    tokenizer,
    imageProcessor,
    textTower,
    visionTower,
    recorder
  }: ConstructorParams) {
    this.tokenizer = tokenizer;
    this.imageProcessor = imageProcessor;
    this.textTower = textTower;
    this.visionTower = visionTower;
    this.recorder = recorder;
  }

  public static async load({recorder}: LoadParams): Promise<TransformersImageEmbedder> {
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
      visionTower,
      recorder
    });
  }

  public embedPicture(pixels: Pixels): Promise<Vector> {
    return RecordedModelCall.run({
      recorder: this.recorder,
      name: 'embed-picture',
      model: VISION_MODEL,
      input: pixels,
      work: async (count: Count): Promise<Vector> => {
        const {data, width, height, channels} = pixels;

        count({image: 1});

        const inputs = await this.imageProcessor(
          new RawImage(data, width, height, channels)
        );
        const {pooler_output} = (await this.visionTower(inputs)) as {
          pooler_output: Tensor;
        };

        return Vector.of({
          values: Array.from(pooler_output.normalize(2, -1).data as Float32Array),
          model: VISION_MODEL
        });
      }
    });
  }

  // Verbatim: no prefix and no case change, as the eval measures the Floor (ADR-0042).
  public embedQuery(query: string): Promise<Vector> {
    return RecordedModelCall.run({
      recorder: this.recorder,
      name: 'embed-query',
      model: VISION_MODEL,
      input: query,
      work: async (count: Count): Promise<Vector> => {
        const ids = this.tokenizer.encode(query, {add_special_tokens: false});
        const windows = TokenWindows.of(ids, WALL_OF_TOKENS - SPECIAL_TOKENS);
        const vectors: Tensor[] = [];

        // The model reads each window padded to the wall.
        count({input: windows.length * WALL_OF_TOKENS});

        for (const window of windows) {
          vectors.push(await this.embedWindow(window));
        }

        return Vector.of({
          values: Array.from(TokenWindows.normalizedMeanOf(vectors).data as Float32Array),
          model: VISION_MODEL
        });
      }
    });
  }

  // padding: 'max_length'. Padded to the longest input, SigLIP gives noise and no error.
  private async embedWindow(ids: readonly number[]): Promise<Tensor> {
    const inputIds = [...ids, this.tokenizer.eos_token_id];
    const padding = Array.from(
      {length: WALL_OF_TOKENS - inputIds.length},
      () => this.tokenizer.pad_token_id
    );
    const {pooler_output} = (await this.textTower({
      input_ids: int64TensorOf([...inputIds, ...padding])
    })) as {pooler_output: Tensor};

    return pooler_output.normalize(2, -1);
  }
}
