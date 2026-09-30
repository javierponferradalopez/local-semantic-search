import {
  AutoModelForSequenceClassification,
  AutoTokenizer,
  type PreTrainedModel,
  type PreTrainedTokenizer,
  type Tensor
} from '@huggingface/transformers';
import type {Result} from '../../../../../../src/core/search/domain/Result';
import {RerankerConfig} from '../../../../../../src/core/search/infrastructure/transformers/RerankerConfig';
import {RERANKER_MODEL} from '../../../../../../src/core/search/infrastructure/transformers/RerankerModel';
import {TransformersReranker} from '../../../../../../src/core/search/infrastructure/transformers/TransformersReranker';
import {StringMother} from '../../../../../utils/object-mother/StringMother';

const WALL_OF_TOKENS = 512;

// <s> Query </s></s> Chunk </s>
const SPECIAL_TOKENS = 4;

// Each one-letter word is one token.
const oneLetterWords = (count: number, letter = 'a'): string =>
  `${letter} `.repeat(count).trim();

const aResult = (text: string, page?: number): Result => {
  const resourceId = StringMother.randomUuid();

  return {
    resourceId,
    name: 'the notes.md',
    contentType: 'markdown',
    fileKey: `resources/${resourceId}/the notes.md`,
    bestMatch: {text, page, score: 0.8}
  };
};

describe('TransformersReranker', () => {
  let reranker: TransformersReranker;
  let tokenizer: PreTrainedTokenizer;
  let model: PreTrainedModel;

  beforeAll(async () => {
    reranker = await TransformersReranker.load();
    tokenizer = await AutoTokenizer.from_pretrained(RERANKER_MODEL.repository);
    model = await AutoModelForSequenceClassification.from_pretrained(
      RERANKER_MODEL.repository,
      {dtype: RERANKER_MODEL.dtype, config: await RerankerConfig.load()}
    );
  });

  // The score of one input to the model, as the tokenizer builds a pair.
  const oneInputScoreOf = async (query: string, text: string): Promise<number> => {
    const {logits} = (await model(tokenizer(query, {text_pair: text}))) as {
      logits: Tensor;
    };

    return (logits.data as Float32Array)[0];
  };

  describe('#rerank', () => {
    it('should give one score for each Result, and keep the other fields of each Result', async () => {
      const results = [
        aResult('Engrasa la cadena de la bicicleta cada 300 kilómetros.', 4),
        aResult('El contrato de alquiler dura un año.')
      ];

      const reranked = await reranker.rerank('la cadena de la bici', results);

      expect(reranked).toHaveLength(results.length);
      expect(reranked).toStrictEqual(
        expect.arrayContaining(
          results.map(result => ({
            ...result,
            bestMatch: {...result.bestMatch, score: expect.any(Number)}
          }))
        )
      );
    });

    it('should give the Results best first', async () => {
      const results = [
        aResult('El contrato de alquiler dura un año.'),
        aResult('Engrasa la cadena de la bicicleta cada 300 kilómetros.'),
        aResult('La fianza es de dos meses.')
      ];

      const reranked = await reranker.rerank('la cadena de la bici', results);

      const scores = reranked.map(result => result.bestMatch.score);
      expect(scores).toStrictEqual(scores.toSorted((first, second) => second - first));
    });

    it('should give the score of one input to the model for a pair that fits in the window', async () => {
      const query = 'la cadena de la bici';
      const text = 'Engrasa la cadena de la bicicleta cada 300 kilómetros.';

      const [{bestMatch}] = await reranker.rerank(query, [aResult(text)]);

      expect(bestMatch.score).toBeCloseTo(await oneInputScoreOf(query, text), 5);
    });

    it('should cut the Chunk to fill the window when only the Chunk is too long', async () => {
      const query = 'la cadena de la bici';
      const queryTokens = tokenizer.encode(query, {add_special_tokens: false}).length;
      const room = WALL_OF_TOKENS - SPECIAL_TOKENS - queryTokens;

      const [{bestMatch}] = await reranker.rerank(query, [
        aResult(`${oneLetterWords(room)} ${oneLetterWords(room, 'b')}`)
      ]);

      expect(bestMatch.score).toBeCloseTo(
        await oneInputScoreOf(query, oneLetterWords(room)),
        5
      );
    });

    it('should cut the Query to fill the window when only the Query is too long', async () => {
      const text = 'Engrasa la cadena de la bicicleta cada 300 kilómetros.';
      const chunkTokens = tokenizer.encode(text, {add_special_tokens: false}).length;
      const room = WALL_OF_TOKENS - SPECIAL_TOKENS - chunkTokens;

      const [{bestMatch}] = await reranker.rerank(
        `${oneLetterWords(room)} ${oneLetterWords(room, 'b')}`,
        [aResult(text)]
      );

      expect(bestMatch.score).toBeCloseTo(
        await oneInputScoreOf(oneLetterWords(room), text),
        5
      );
    });

    it('should cut the Query and the Chunk to a half of the window each when both are too long', async () => {
      const half = (WALL_OF_TOKENS - SPECIAL_TOKENS) / 2;

      const [{bestMatch}] = await reranker.rerank(
        `${oneLetterWords(half)} ${oneLetterWords(half, 'c')}`,
        [aResult(`${oneLetterWords(half, 'b')} ${oneLetterWords(half, 'd')}`)]
      );

      expect(bestMatch.score).toBeCloseTo(
        await oneInputScoreOf(oneLetterWords(half), oneLetterWords(half, 'b')),
        5
      );
    });

    it('should give the same scores to calls that run at the same time', async () => {
      const results = [
        aResult('Engrasa la cadena de la bicicleta cada 300 kilómetros.'),
        aResult('El contrato de alquiler dura un año.')
      ];
      const alone = await reranker.rerank('la cadena de la bici', results);

      const together = await Promise.all([
        reranker.rerank('la cadena de la bici', results),
        reranker.rerank('el alquiler del piso', results),
        reranker.rerank('la cadena de la bici', results)
      ]);

      expect(together[0]).toStrictEqual(alone);
      expect(together[2]).toStrictEqual(alone);
    });

    it('should give a score for a pair much longer than the positions of the model', async () => {
      const [{bestMatch}] = await reranker.rerank(oneLetterWords(10_000), [
        aResult(oneLetterWords(10_000, 'b'))
      ]);

      expect(Number.isFinite(bestMatch.score)).toBe(true);
    });

    it('should give no Result for no Result', async () => {
      expect(await reranker.rerank('la cadena de la bici', [])).toStrictEqual([]);
    });
  });
});
