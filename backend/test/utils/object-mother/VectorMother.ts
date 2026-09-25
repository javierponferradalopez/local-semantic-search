import {Vector} from '../../../src/core/shared/domain/value-objects/Vector';
import {TEXT_MODEL} from '../../../src/core/shared/infrastructure/transformers/TextModel';

export const VectorMother = {
  random(): Vector {
    return Vector.of({
      values: Array.from({length: TEXT_MODEL.width}, () => Math.random()),
      model: TEXT_MODEL
    });
  }
};
