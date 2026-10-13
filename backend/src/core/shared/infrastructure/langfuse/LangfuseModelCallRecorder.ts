import {type LangfuseGenerationAttributes, startObservation} from '@langfuse/tracing';
import type {ModelCall, ModelCallRecorder} from '../../domain/services/ModelCallRecorder';
import {LazyTrace} from './LazyTrace';

const isPixels = (
  input: ModelCall['input']
): input is Extract<ModelCall['input'], {data: Uint8Array}> =>
  typeof input === 'object' && 'data' in input;

// The pixels of a Picture stay here: the queue of spans stays small.
const inputOf = (input: ModelCall['input']): unknown =>
  isPixels(input)
    ? {width: input.width, height: input.height, channels: input.channels}
    : input;

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
  input: inputOf(call.input),
  output: call.output,
  ...(call.error !== undefined && errorOf(call.error))
});

export class LangfuseModelCallRecorder implements ModelCallRecorder {
  public record(call: ModelCall): void {
    try {
      startObservation(call.name, attributesOf(call), {
        asType: 'embedding',
        startTime: call.startTime,
        parentSpanContext: LazyTrace.current()?.rootSpanContext()
      }).end(call.endTime);
    } catch (error) {
      console.error('A Model call cannot be recorded', error);
    }
  }
}
