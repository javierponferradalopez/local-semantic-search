import {
  AutoModel,
  AutoTokenizer,
  mean_pooling,
  type PreTrainedModel,
  type PreTrainedTokenizer
} from '@huggingface/transformers';
import {CUT} from '../../../../../../src/core/ingestion/domain/Cut';
import type {Vector} from '../../../../../../src/core/shared/domain/value-objects/Vector';
import {TEXT_MODEL} from '../../../../../../src/core/shared/infrastructure/transformers/TextModel';
import {TransformersTextEmbedder} from '../../../../../../src/core/shared/infrastructure/transformers/TransformersTextEmbedder';
import {StringMother} from '../../../../../utils/object-mother/StringMother';

// The worst cases of ADR-0014, at the length of the cap: each one passes the wall of tokens.
const WORST_CASES: Record<string, () => string> = {
  digits: () => StringMother.randomDigits(CUT.cap),
  'a string with no spaces': () => StringMother.randomWithNoSpaces(CUT.cap),
  'characters the vocabulary does not know': () =>
    StringMother.randomUnknownToTheVocabulary(CUT.cap)
};

const WALL_OF_TOKENS = 512;

// Each one-letter word is one token.
const oneLetterWords = (count: number, letter = 'a'): string =>
  `${letter} `.repeat(count).trim();

describe('TransformersTextEmbedder', () => {
  let embedder: TransformersTextEmbedder;
  let tokenizer: PreTrainedTokenizer;
  let model: PreTrainedModel;

  beforeAll(async () => {
    embedder = await TransformersTextEmbedder.load();
    [tokenizer, model] = await Promise.all([
      AutoTokenizer.from_pretrained(TEXT_MODEL.repository),
      AutoModel.from_pretrained(TEXT_MODEL.repository, {dtype: TEXT_MODEL.dtype})
    ]);
  });

  // The Vectors in the store came from one input to the model, before the windows.
  const oneInputValuesOf = async (text: string): Promise<number[]> => {
    const inputs = tokenizer(text);
    const {last_hidden_state} = await model(inputs);

    return Array.from(
      mean_pooling(last_hidden_state, inputs.attention_mask).normalize(2, -1)
        .data as Float32Array
    );
  };

  describe.each([
    [
      '#embedChunk',
      'passage: ',
      (text: string): Promise<Vector> => embedder.embedChunk(text)
    ],
    [
      '#embedQuery',
      'query: ',
      (text: string): Promise<Vector> => embedder.embedQuery(text)
    ]
  ])('%s', (_, prefix, embed) => {
    it.each(Object.entries(WORST_CASES))(
      'should give one Vector for %s',
      async (__, worstCase) => {
        const vector = await embed(worstCase());

        expect(vector.value).toHaveLength(TEXT_MODEL.width);
      }
    );

    it('should give two different Vector for two different runs of digits', async () => {
      const first = await embed(StringMother.randomDigits(CUT.cap));
      const second = await embed(StringMother.randomDigits(CUT.cap));

      expect(first.value).not.toStrictEqual(second.value);
    });

    it('should give a different Vector for each worst case', async () => {
      const vectors: Vector[] = [];

      for (const worstCase of Object.values(WORST_CASES)) {
        vectors.push(await embed(worstCase()));
      }

      const distinct = new Set(vectors.map(vector => JSON.stringify(vector.value)));

      expect(distinct.size).toBe(vectors.length);
    });

    it('should give the Vector of one input to the model for a text that fits in one window', async () => {
      const text = StringMother.randomDigits(CUT.minimum);

      const vector = await embed(text);

      const expected = await oneInputValuesOf(`${prefix}${text}`);
      expect(vector.value).toStrictEqual(expected.map(value => expect.closeTo(value, 6)));
    });

    it('should give one Vector for a text one token longer than a window', async () => {
      const prefixTokens = tokenizer.encode(prefix.trim(), {
        add_special_tokens: false
      }).length;
      const window = WALL_OF_TOKENS - 2 - prefixTokens;

      const vector = await embed(oneLetterWords(window + 1));

      expect(vector.value).toHaveLength(TEXT_MODEL.width);
    });

    it('should give the normalised mean of the Vector of each half for a text of two halves', async () => {
      const half = (WALL_OF_TOKENS - 2) / 2;

      const vector = await embed(
        `${oneLetterWords(half, 'a')} ${oneLetterWords(half, 'b')}`
      );

      const first = await oneInputValuesOf(`${prefix}${oneLetterWords(half, 'a')}`);
      const second = await oneInputValuesOf(`${prefix}${oneLetterWords(half, 'b')}`);
      const sum = first.map((value, index) => value + second[index]);
      const expected = sum.map(value => value / Math.hypot(...sum));
      expect(vector.value).toStrictEqual(expected.map(value => expect.closeTo(value, 6)));
    });

    it('should give a Vector of length one for a text of many windows', async () => {
      const vector = await embed(StringMother.randomUnknownToTheVocabulary(CUT.cap));

      expect(Math.hypot(...vector.value)).toBeCloseTo(1, 6);
    });

    it('should give two different Vector for two texts that differ only in the last character', async () => {
      const start = StringMother.randomDigits(CUT.cap - 1);

      const first = await embed(`${start}1`);
      const second = await embed(`${start}2`);

      expect(first.value).not.toStrictEqual(second.value);
    });
  });
});
