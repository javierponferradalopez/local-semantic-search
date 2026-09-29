import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {
  AutoTokenizer,
  type PreTrainedModel,
  type PreTrainedTokenizer,
  SiglipTextModel,
  type Tensor
} from '@huggingface/transformers';
import {CUT} from '../../../../../../src/core/ingestion/domain/Cut';
import {SharpImageDecoder} from '../../../../../../src/core/ingestion/infrastructure/sharp/SharpImageDecoder';
import type {Pixels} from '../../../../../../src/core/shared/domain/services/ImageEmbedder';
import type {Vector} from '../../../../../../src/core/shared/domain/value-objects/Vector';
import {TransformersImageEmbedder} from '../../../../../../src/core/shared/infrastructure/transformers/TransformersImageEmbedder';
import {VISION_MODEL} from '../../../../../../src/core/shared/infrastructure/transformers/VisionModel';
import {StringMother} from '../../../../../utils/object-mother/StringMother';

const FIXTURES = join(import.meta.dirname, '../../../../../fixtures');

// Measured at 0.67 for the two fixtures.
const MOST_SIMILARITY_OF_TWO_CLEARLY_DIFFERENT_PICTURES = 0.8;

// The worst cases of ADR-0014, at the length of the cap: each one passes the wall of tokens.
const WORST_CASES: Record<string, () => string> = {
  digits: () => StringMother.randomDigits(CUT.cap),
  'a string with no spaces': () => StringMother.randomWithNoSpaces(CUT.cap),
  'characters the vocabulary does not know': () =>
    StringMother.randomUnknownToTheVocabulary(CUT.cap)
};

const WALL_OF_TOKENS = 64;

// The tokenizer ends each input with <eos>.
const WINDOW: number = WALL_OF_TOKENS - 1;

// Each one-letter word is one token.
const oneLetterWords = (count: number, letter = 'a'): string =>
  `${letter} `.repeat(count).trim();

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
  let tokenizer: PreTrainedTokenizer;
  let textTower: PreTrainedModel;
  let aPicture: Pixels;
  let aDiagram: Pixels;

  beforeAll(async () => {
    embedder = await TransformersImageEmbedder.load();
    [tokenizer, textTower] = await Promise.all([
      AutoTokenizer.from_pretrained(VISION_MODEL.repository),
      SiglipTextModel.from_pretrained(VISION_MODEL.repository, {
        dtype: VISION_MODEL.dtype
      })
    ]);
    aPicture = await pixelsOf('a-small-picture.png', 'png');
    aDiagram = await pixelsOf('a-diagram-with-only-a-viewbox.svg', 'svg');
  });

  // The Query of the probes that set the Floor: one input, padded to the wall (ADR-0021).
  const oneInputValuesOf = async (text: string): Promise<number[]> => {
    const {input_ids} = tokenizer(text, {
      padding: 'max_length',
      max_length: WALL_OF_TOKENS,
      truncation: true
    });
    const {pooler_output} = (await textTower({input_ids})) as {pooler_output: Tensor};

    return Array.from(pooler_output.normalize(2, -1).data as Float32Array);
  };

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

  describe('#embedQuery', () => {
    it('should give one Vector of the Vision model, of length one', async () => {
      const vector = await embedder.embedQuery('una playa al atardecer');

      expect(vector.model).toStrictEqual({
        repository: VISION_MODEL.repository,
        dtype: VISION_MODEL.dtype,
        width: VISION_MODEL.width
      });
      expect(Math.hypot(...vector.value)).toBeCloseTo(1, 6);
    });

    it('should give the Vector of one input padded to the wall for a Query that fits in one window', async () => {
      const query = 'Una mujer en la PLAYA, al atardecer';

      const vector = await embedder.embedQuery(query);

      const expected = await oneInputValuesOf(query);
      expect(vector.value).toStrictEqual(expected.map(value => expect.closeTo(value, 6)));
    });

    it.each(Object.entries(WORST_CASES))(
      'should give one Vector for %s',
      async (_, worstCase) => {
        const vector = await embedder.embedQuery(worstCase());

        expect(vector.value).toHaveLength(VISION_MODEL.width);
      }
    );

    it('should give two different Vector for two different runs of digits', async () => {
      const first = await embedder.embedQuery(StringMother.randomDigits(CUT.cap));
      const second = await embedder.embedQuery(StringMother.randomDigits(CUT.cap));

      expect(first.value).not.toStrictEqual(second.value);
    });

    it('should give a different Vector for each worst case', async () => {
      const vectors: Vector[] = [];

      for (const worstCase of Object.values(WORST_CASES)) {
        vectors.push(await embedder.embedQuery(worstCase()));
      }

      const distinct = new Set(vectors.map(vector => JSON.stringify(vector.value)));

      expect(distinct.size).toBe(vectors.length);
    });

    it('should give one Vector for a Query one token longer than a window', async () => {
      const vector = await embedder.embedQuery(oneLetterWords(WINDOW + 1));

      expect(vector.value).toHaveLength(VISION_MODEL.width);
    });

    it('should give the normalised mean of the Vector of each half for a Query of two halves', async () => {
      const vector = await embedder.embedQuery(
        `${oneLetterWords(WINDOW, 'a')} ${oneLetterWords(WINDOW, 'b')}`
      );

      const first = await oneInputValuesOf(oneLetterWords(WINDOW, 'a'));
      // Inside the Query, a space leads the first 'b', and the tokenizer keeps it.
      const second = await oneInputValuesOf(` ${oneLetterWords(WINDOW, 'b')}`);
      const sum = first.map((value, index) => value + (second[index] ?? Number.NaN));
      const expected = sum.map(value => value / Math.hypot(...sum));
      expect(vector.value).toStrictEqual(expected.map(value => expect.closeTo(value, 6)));
    });

    it('should give a Vector of length one for a Query of many windows', async () => {
      const vector = await embedder.embedQuery(
        StringMother.randomUnknownToTheVocabulary(CUT.cap)
      );

      expect(Math.hypot(...vector.value)).toBeCloseTo(1, 6);
    });

    it('should give two different Vector for two Queries that differ only in the last character', async () => {
      const start = StringMother.randomDigits(CUT.cap - 1);

      const first = await embedder.embedQuery(`${start}1`);
      const second = await embedder.embedQuery(`${start}2`);

      expect(first.value).not.toStrictEqual(second.value);
    });
  });
});
