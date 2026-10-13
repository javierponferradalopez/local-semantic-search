import {
  type LangfuseEmbedding,
  type LangfuseGenerationAttributes,
  startObservation
} from '@langfuse/tracing';
import sharp from 'sharp';
import type {Pixels} from '../../domain/services/ImageEmbedder';
import type {ModelCall, ModelCallRecorder} from '../../domain/services/ModelCallRecorder';
import {LazyTrace} from './LazyTrace';

// The size of the thumbnail of an Image Resource: the queue of spans stays small (ADR-0048).
const LONG_EDGE_OF_THE_WEBP = 320;

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

const errorOf = (
  error: unknown
): Pick<LangfuseGenerationAttributes, 'level' | 'statusMessage'> => ({
  level: 'ERROR',
  statusMessage: error instanceof Error ? error.message : String(error)
});

const attributesOf = (call: ModelCall): LangfuseGenerationAttributes => ({
  model: call.model.repository,
  metadata: {dtype: call.model.dtype},
  usageDetails: usageDetailsOf(call.usage),
  input: isPixels(call.input) ? undefined : call.input,
  output: call.output,
  ...(call.error !== undefined && errorOf(call.error))
});

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
  console.error('A Model call cannot be recorded', error);
};

export class LangfuseModelCallRecorder implements ModelCallRecorder {
  public record(call: ModelCall): void {
    try {
      const embedding = startObservation(call.name, attributesOf(call), {
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
