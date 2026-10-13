import {
  type LangfuseEmbedding,
  type LangfuseGenerationAttributes,
  startObservation
} from '@langfuse/tracing';
import sharp from 'sharp';
import type {Pixels} from '../../domain/services/ImageEmbedder';
import type {
  ModelCall,
  ModelCallTracker,
  Usage
} from '../../domain/services/ModelCallTracker';
import {LazyTrace} from './LazyTrace';

// The size of the thumbnail of an Image Resource: the queue of spans stays small (ADR-0048).
const LONG_EDGE_OF_THE_WEBP = 320;

// USD for each unit of a Usage key (ADR-0049).
export type Price = {[Key in keyof Usage]?: number};

type ConstructorParams = {models: readonly {repository: string; price: Price}[]};

const isPixels = (input: ModelCall['input']): input is Pixels =>
  typeof input === 'object' && 'data' in input;

// The span processor uploads a base64 data URI in the input as a media file.
const webpOf = async ({data, width, height, channels}: Pixels): Promise<string> => {
  const webp = await sharp(data, {raw: {width, height, channels}})
    .resize(LONG_EDGE_OF_THE_WEBP, LONG_EDGE_OF_THE_WEBP, {fit: 'inside'})
    .webp()
    .toBuffer();

  return `data:image/webp;base64,${webp.toString('base64')}`;
};

const usageDetailsOf = (usage: ModelCall['usage']): Record<string, number> =>
  Object.fromEntries(Object.entries(usage).filter(([, units]) => units !== undefined));

const costDetailsOf = (usage: Usage, price: Price): Record<string, number> =>
  Object.fromEntries(
    Object.entries(usageDetailsOf(usage)).flatMap(([key, units]) => {
      const unitPrice = price[key as keyof Usage];

      return unitPrice === undefined ? [] : [[key, units * unitPrice]];
    })
  );

const errorOf = (
  error: unknown
): Pick<LangfuseGenerationAttributes, 'level' | 'statusMessage'> => ({
  level: 'ERROR',
  statusMessage: error instanceof Error ? error.message : String(error)
});

const attributesOf = (call: ModelCall, price: Price): LangfuseGenerationAttributes => {
  const costDetails = costDetailsOf(call.usage, price);

  return {
    model: call.model.repository,
    metadata: {dtype: call.model.dtype},
    usageDetails: usageDetailsOf(call.usage),
    ...(Object.keys(costDetails).length > 0 && {costDetails}),
    input: isPixels(call.input) ? undefined : call.input,
    output: call.output,
    ...(call.error !== undefined && errorOf(call.error))
  };
};

// The observation ends after the WebP, so its input is set before it leaves.
const endWithTheWebp = async (
  embedding: LangfuseEmbedding,
  pixels: Pixels,
  endTime: Date
): Promise<void> => {
  try {
    embedding.update({input: await webpOf(pixels)});
  } catch (error) {
    console.error('The Picture of a Model call cannot become a WebP', error);
  }

  embedding.end(endTime);
};

const logTheFailure = (error: unknown): void => {
  console.error('A Model call cannot be tracked', error);
};

export class LangfuseModelCallTracker implements ModelCallTracker {
  private readonly _prices: ReadonlyMap<string, Price>;

  public constructor({models}: ConstructorParams) {
    this._prices = new Map(models.map(({repository, price}) => [repository, price]));
  }

  public track(call: ModelCall): void {
    try {
      const price = this._prices.get(call.model.repository) ?? {};
      const embedding = startObservation(call.name, attributesOf(call, price), {
        asType: 'embedding',
        startTime: call.startTime,
        parentSpanContext: LazyTrace.current()?.rootSpanContext()
      });

      if (isPixels(call.input)) {
        endWithTheWebp(embedding, call.input, call.endTime).catch(logTheFailure);
      } else {
        embedding.end(call.endTime);
      }
    } catch (error) {
      logTheFailure(error);
    }
  }
}
