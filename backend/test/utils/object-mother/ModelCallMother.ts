import type {ModelCall} from '../../../src/core/shared/domain/services/ModelCallRecorder';

export const ModelCallMother = {
  embedQuery(call: Partial<ModelCall> = {}): ModelCall {
    return {
      name: 'embed-query',
      model: {repository: 'Xenova/multilingual-e5-small', dtype: 'fp32'},
      usage: {input: 7},
      input: 'the notes of the meeting',
      startTime: new Date(Date.now() - 20),
      endTime: new Date(),
      ...call
    };
  }
};
