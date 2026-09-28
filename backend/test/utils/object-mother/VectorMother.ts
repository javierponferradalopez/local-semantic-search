import {
  type ModelIdentity,
  Vector
} from '../../../src/core/shared/domain/value-objects/Vector';
import {TEXT_MODEL} from '../../../src/core/shared/infrastructure/transformers/TextModel';

export const VectorMother = {
  random(): Vector {
    return Vector.of({
      values: Array.from({length: TEXT_MODEL.width}, () => Math.random()),
      model: TEXT_MODEL
    });
  },

  // The first axis, so that the cosine of any Vector to it is its first value.
  axis(): Vector {
    return VectorMother.withSimilarityToTheAxis(1);
  },

  withSimilarityToTheAxis(similarity: number, model: ModelIdentity = TEXT_MODEL): Vector {
    const values = Array.from({length: model.width}, () => 0);
    values[0] = similarity;
    values[1] = Math.sqrt(1 - similarity ** 2);

    return Vector.of({values, model});
  }
};
