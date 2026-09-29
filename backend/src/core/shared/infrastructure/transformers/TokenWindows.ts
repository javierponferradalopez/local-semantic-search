import {cat, type Tensor} from '@huggingface/transformers';

// No truncation: it drops text, and a Ready row would then lie (ADR-0014).
export const TokenWindows = {
  // Windows of almost one length, so the mean weighs them the same.
  of(ids: readonly number[], size: number): number[][] {
    const count = Math.max(1, Math.ceil(ids.length / size));
    const length = Math.ceil(ids.length / count);

    return Array.from({length: count}, (_, index) =>
      ids.slice(index * length, (index + 1) * length)
    );
  },

  normalizedMeanOf(vectors: Tensor[]): Tensor {
    return cat(vectors, 0).mean(0).normalize(2, -1);
  }
};
