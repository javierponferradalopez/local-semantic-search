import type {ModelCall} from '../../../src/core/shared/domain/services/ModelCallTracker';

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
  },

  embedPicture(call: Partial<ModelCall> = {}): ModelCall {
    return ModelCallMother.embedQuery({
      name: 'embed-picture',
      model: {repository: 'onnx-community/siglip2-base-patch16-224-ONNX', dtype: 'fp32'},
      usage: {image: 1},
      input: {data: new Uint8Array(2 * 2 * 3), width: 2, height: 2, channels: 3},
      ...call
    });
  }
};
