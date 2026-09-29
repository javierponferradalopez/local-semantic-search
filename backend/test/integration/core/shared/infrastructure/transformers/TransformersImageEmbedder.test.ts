import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {SharpImageDecoder} from '../../../../../../src/core/ingestion/infrastructure/sharp/SharpImageDecoder';
import type {Pixels} from '../../../../../../src/core/shared/domain/services/ImageEmbedder';
import {TransformersImageEmbedder} from '../../../../../../src/core/shared/infrastructure/transformers/TransformersImageEmbedder';
import {VISION_MODEL} from '../../../../../../src/core/shared/infrastructure/transformers/VisionModel';

const FIXTURES = join(import.meta.dirname, '../../../../../fixtures');

// Measured at 0.67 for the two fixtures.
const MOST_SIMILARITY_OF_TWO_CLEARLY_DIFFERENT_PICTURES = 0.8;

const pixelsOf = async (name: string, contentType: 'png' | 'svg'): Promise<Pixels> =>
  (
    await new SharpImageDecoder().decode(
      await readFile(join(FIXTURES, name)),
      contentType
    )
  ).pixels;

const cosineOf = (first: readonly number[], second: readonly number[]): number =>
  first.reduce((sum, value, index) => sum + value * (second[index] ?? Number.NaN), 0);

describe('TransformersImageEmbedder', () => {
  let embedder: TransformersImageEmbedder;
  let aPicture: Pixels;
  let aDiagram: Pixels;

  beforeAll(async () => {
    embedder = await TransformersImageEmbedder.load();
    aPicture = await pixelsOf('a-small-picture.png', 'png');
    aDiagram = await pixelsOf('a-diagram-with-only-a-viewbox.svg', 'svg');
  });

  describe('#embedPicture', () => {
    it('should give one Vector of the Vision model, of length one', async () => {
      const vector = await embedder.embedPicture(aPicture);

      expect(vector.model).toStrictEqual({
        repository: VISION_MODEL.repository,
        dtype: VISION_MODEL.dtype,
        width: VISION_MODEL.width
      });
      expect(vector.value).toHaveLength(VISION_MODEL.width);
      expect(Math.hypot(...vector.value)).toBeCloseTo(1, 6);
    });

    it('should give two clearly different Vector for two clearly different pictures', async () => {
      const first = await embedder.embedPicture(aPicture);
      const second = await embedder.embedPicture(aDiagram);

      expect(cosineOf(first.value, second.value)).toBeLessThan(
        MOST_SIMILARITY_OF_TWO_CLEARLY_DIFFERENT_PICTURES
      );
    });

    it('should give the same Vector for the same pixels', async () => {
      const first = await embedder.embedPicture(aPicture);
      const second = await embedder.embedPicture(aPicture);

      expect(first.value).toStrictEqual(second.value);
    });
  });
});
