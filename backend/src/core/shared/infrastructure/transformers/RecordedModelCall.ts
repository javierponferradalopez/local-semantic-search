import type {
  ModelCall,
  ModelCallRecorder,
  Usage
} from '../../domain/services/ModelCallRecorder';

export type Count = (usage: Usage) => void;

type Params<T> = {
  recorder: ModelCallRecorder;
  name: ModelCall['name'];
  model: ModelCall['model'];
  input: ModelCall['input'];
  // The work counts its Usage before the model runs, so a call that throws keeps it.
  work: (count: Count) => Promise<T>;
  outputOf?: (value: T) => readonly number[];
};

export const RecordedModelCall = {
  async run<T>({recorder, name, model, input, work, outputOf}: Params<T>): Promise<T> {
    const call = {name, model: {repository: model.repository, dtype: model.dtype}, input};
    const startTime = new Date();
    let usage: Usage = {};
    let value: T;

    try {
      value = await work(counted => {
        usage = counted;
      });
    } catch (error) {
      recorder.record({...call, usage, startTime, endTime: new Date(), error});
      throw error;
    }

    recorder.record({
      ...call,
      usage,
      ...(outputOf && {output: outputOf(value)}),
      startTime,
      endTime: new Date()
    });

    return value;
  }
};
