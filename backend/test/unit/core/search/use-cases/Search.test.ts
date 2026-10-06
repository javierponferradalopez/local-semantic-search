import type {MockInstance} from 'vitest';
import type {PictureResult} from '../../../../../src/core/search/domain/PictureResult';
import type {PictureResultReader} from '../../../../../src/core/search/domain/PictureResultReader';
import type {Result} from '../../../../../src/core/search/domain/Result';
import type {ResultReader} from '../../../../../src/core/search/domain/ResultReader';
import type {Reranker} from '../../../../../src/core/search/domain/services/Reranker';
import {Search} from '../../../../../src/core/search/use-cases/Search';
import {ValueObjectError} from '../../../../../src/core/shared/domain/errors/ValueObjectError';
import type {FileStore} from '../../../../../src/core/shared/domain/services/FileStore';
import type {ImageEmbedder} from '../../../../../src/core/shared/domain/services/ImageEmbedder';
import type {TextEmbedder} from '../../../../../src/core/shared/domain/services/TextEmbedder';
import {VISION_MODEL} from '../../../../../src/core/shared/infrastructure/transformers/VisionModel';
import {type MockProxy, mock} from '../../../../utils/mock';
import {StringMother} from '../../../../utils/object-mother/StringMother';
import {VectorMother} from '../../../../utils/object-mother/VectorMother';

const TEXT_FLOOR = 0.5;
const TEXT_MARGIN = 0.2;
const IMAGE_FLOOR = 0.05;
const IMAGE_MARGIN = 0.02;

const aResult = (overrides: Partial<Result> = {}): Result => {
  const resourceId = StringMother.randomUuid();

  return {
    resourceId,
    name: 'the notes.md',
    contentType: 'markdown',
    fileKey: `resources/${resourceId}/the notes.md`,
    bestMatch: {text: 'A paragraph about the trip.', score: 0.8},
    ...overrides
  };
};

const aPictureResult = (overrides: Partial<PictureResult> = {}): PictureResult => {
  const resourceId = StringMother.randomUuid();

  return {
    resourceId,
    name: 'the beach.png',
    fileKey: `resources/${resourceId}/the beach.png`,
    thumbnailKey: `ingestion/thumbnails/${resourceId}.webp`,
    bestMatch: {score: 0.1},
    ...overrides
  };
};

describe('Search', () => {
  let textEmbedder: MockProxy<TextEmbedder>;
  let imageEmbedder: MockProxy<ImageEmbedder>;
  let resultReader: MockProxy<ResultReader>;
  let reranker: MockProxy<Reranker>;
  let pictureResultReader: MockProxy<PictureResultReader>;
  let fileStore: MockProxy<FileStore>;
  let consoleError: MockInstance<typeof console.error>;
  let search: Search;

  const aSearch = (
    cut: {
      textFloor?: number;
      textMargin?: number;
      imageFloor?: number;
      imageMargin?: number;
    } = {}
  ): Search =>
    new Search({
      textEmbedder,
      imageEmbedder,
      resultReader,
      reranker,
      pictureResultReader,
      fileStore,
      textFloor: TEXT_FLOOR,
      textMargin: TEXT_MARGIN,
      imageFloor: IMAGE_FLOOR,
      imageMargin: IMAGE_MARGIN,
      ...cut
    });

  beforeEach(() => {
    textEmbedder = mock<TextEmbedder>();
    imageEmbedder = mock<ImageEmbedder>();
    resultReader = mock<ResultReader>();
    reranker = mock<Reranker>();
    pictureResultReader = mock<PictureResultReader>();
    fileStore = mock<FileStore>();
    textEmbedder.embedQuery.mockResolvedValue(VectorMother.random());
    imageEmbedder.embedQuery.mockResolvedValue(VectorMother.random(VISION_MODEL));
    resultReader.getBestFirst.mockResolvedValue([]);
    reranker.rerank.mockImplementation(async (_, results) => [...results]);
    pictureResultReader.getBestFirst.mockResolvedValue([]);
    fileStore.urlOf.mockImplementation(fileKey => `/files/${fileKey.value}`);
    consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    search = aSearch();
  });

  const rerankedAs = (results: Result[]): void => {
    resultReader.getBestFirst.mockResolvedValue(results);
    reranker.rerank.mockResolvedValue(results);
  };

  describe('#constructor', () => {
    it.each([
      ['text', {textFloor: Number.NaN}],
      ['image', {imageFloor: Number.POSITIVE_INFINITY}]
    ])('should refuse a %s Floor that is not a finite score', (_, floors) => {
      expect(() => aSearch(floors)).toThrow(ValueObjectError);
    });

    it.each([
      ['text', {textMargin: Number.NaN}],
      ['text', {textMargin: -0.01}],
      ['image', {imageMargin: Number.NaN}],
      ['image', {imageMargin: -0.01}]
    ])('should refuse the %s Margin %o', (_, margins) => {
      expect(() => aSearch(margins)).toThrow(ValueObjectError);
    });
  });

  describe('#run', () => {
    it('should embed the Query exactly as the user typed it, with each model', async () => {
      await search.run({query: '  Animales ACUÁTICOS '});

      expect(textEmbedder.embedQuery).toHaveBeenCalledWith('  Animales ACUÁTICOS ');
      expect(imageEmbedder.embedQuery).toHaveBeenCalledWith('  Animales ACUÁTICOS ');
    });

    it('should give the Vector of each model to the port of its own group', async () => {
      const textVector = VectorMother.random();
      const imageVector = VectorMother.random(VISION_MODEL);
      textEmbedder.embedQuery.mockResolvedValue(textVector);
      imageEmbedder.embedQuery.mockResolvedValue(imageVector);

      await search.run({query: 'the trip'});

      expect(resultReader.getBestFirst).toHaveBeenCalledWith(textVector);
      expect(pictureResultReader.getBestFirst).toHaveBeenCalledWith(imageVector);
    });

    it('should give the Query and the Results of the text port to the Reranker', async () => {
      const results = [aResult({name: 'the best.md'}), aResult({name: 'the second.md'})];
      resultReader.getBestFirst.mockResolvedValue(results);

      await search.run({query: '  Animales ACUÁTICOS '});

      expect(reranker.rerank).toHaveBeenCalledWith('  Animales ACUÁTICOS ', results);
    });

    it('should give the text Results in the order of the Reranker', async () => {
      const [first, second, third] = [
        aResult({name: 'the first.md'}),
        aResult({name: 'the second.md'}),
        aResult({name: 'the third.md'})
      ];
      resultReader.getBestFirst.mockResolvedValue([first, second, third]);
      reranker.rerank.mockResolvedValue([third, first, second]);

      const {text} = await search.run({query: 'the trip'});

      expect(text.map(result => result.name)).toStrictEqual([
        'the third.md',
        'the first.md',
        'the second.md'
      ]);
    });

    it('should not call the Reranker when the text port gives no Result', async () => {
      resultReader.getBestFirst.mockResolvedValue([]);

      await search.run({query: 'the trip'});

      expect(reranker.rerank).not.toHaveBeenCalled();
    });

    it('should give the whole text of the best Match, its page and the URL of the File', async () => {
      const result = aResult({
        name: 'the manual.pdf',
        contentType: 'pdf',
        bestMatch: {text: 'The text on page four.', page: 4, score: 0.9}
      });
      resultReader.getBestFirst.mockResolvedValue([result]);

      const {text} = await search.run({query: 'the trip'});

      expect(text).toStrictEqual([
        {
          resourceId: result.resourceId,
          name: 'the manual.pdf',
          contentType: 'pdf',
          text: 'The text on page four.',
          page: 4,
          fileUrl: `/files/${result.fileKey}`
        }
      ]);
    });

    it('should keep no page key when the best Match has no page', async () => {
      resultReader.getBestFirst.mockResolvedValue([aResult()]);

      const {text} = await search.run({query: 'the trip'});

      expect(text[0]).not.toHaveProperty('page');
    });

    it('should give no score in either group', async () => {
      resultReader.getBestFirst.mockResolvedValue([aResult()]);
      pictureResultReader.getBestFirst.mockResolvedValue([aPictureResult()]);

      const {text, images} = await search.run({query: 'the trip'});

      expect(text[0]).not.toHaveProperty('score');
      expect(images[0]).not.toHaveProperty('score');
    });

    it('should give the image Results of the port in their order', async () => {
      pictureResultReader.getBestFirst.mockResolvedValue([
        aPictureResult({name: 'the best.png'}),
        aPictureResult({name: 'the second.png'}),
        aPictureResult({name: 'the third.png'})
      ]);

      const {images} = await search.run({query: 'the trip'});

      expect(images.map(result => result.name)).toStrictEqual([
        'the best.png',
        'the second.png',
        'the third.png'
      ]);
    });

    it('should give the name, the URL of the File and the URL of the thumbnail of an image Result', async () => {
      const result = aPictureResult({name: 'the beach.png'});
      pictureResultReader.getBestFirst.mockResolvedValue([result]);

      const {images} = await search.run({query: 'the beach'});

      expect(images).toStrictEqual([
        {
          resourceId: result.resourceId,
          name: 'the beach.png',
          fileUrl: `/files/${result.fileKey}`,
          thumbnailUrl: `/files/${result.thumbnailKey}`
        }
      ]);
    });

    it('should give no image Result when the best Match is under the image Floor', async () => {
      pictureResultReader.getBestFirst.mockResolvedValue([
        aPictureResult({bestMatch: {score: IMAGE_FLOOR - 0.01}}),
        aPictureResult({bestMatch: {score: IMAGE_FLOOR - 0.02}})
      ]);

      const {images} = await search.run({query: 'the beach'});

      expect(images).toStrictEqual([]);
    });

    it('should keep an image Result under the Floor within the Margin, and remove one outside it, when the best Match reaches the image Floor', async () => {
      pictureResultReader.getBestFirst.mockResolvedValue([
        aPictureResult({name: 'the best.png', bestMatch: {score: IMAGE_FLOOR}}),
        aPictureResult({name: 'the second.png', bestMatch: {score: IMAGE_FLOOR - 0.01}}),
        aPictureResult({name: 'the third.png', bestMatch: {score: IMAGE_FLOOR - 0.3}})
      ]);

      const {images} = await search.run({query: 'the beach'});

      expect(images.map(result => result.name)).toStrictEqual([
        'the best.png',
        'the second.png'
      ]);
    });

    it('should keep an image Result at exactly the best score minus the image Margin', async () => {
      const best = IMAGE_FLOOR + 0.3;
      pictureResultReader.getBestFirst.mockResolvedValue([
        aPictureResult({name: 'the best.png', bestMatch: {score: best}}),
        aPictureResult({name: 'at the edge.png', bestMatch: {score: best - IMAGE_MARGIN}})
      ]);

      const {images} = await search.run({query: 'the beach'});

      expect(images.map(result => result.name)).toStrictEqual([
        'the best.png',
        'at the edge.png'
      ]);
    });

    it('should remove each image Result below the best score minus the image Margin', async () => {
      const best = IMAGE_FLOOR + 0.3;
      pictureResultReader.getBestFirst.mockResolvedValue([
        aPictureResult({name: 'the best.png', bestMatch: {score: best}}),
        aPictureResult({name: 'near.png', bestMatch: {score: best - 0.01}}),
        aPictureResult({name: 'far.png', bestMatch: {score: best - IMAGE_MARGIN - 0.01}}),
        aPictureResult({name: 'farther.png', bestMatch: {score: best - 1}})
      ]);

      const {images} = await search.run({query: 'the beach'});

      expect(images.map(result => result.name)).toStrictEqual([
        'the best.png',
        'near.png'
      ]);
    });

    it('should keep the text group when the image group is empty', async () => {
      resultReader.getBestFirst.mockResolvedValue([aResult({name: 'the notes.md'})]);
      pictureResultReader.getBestFirst.mockResolvedValue([
        aPictureResult({bestMatch: {score: IMAGE_FLOOR - 0.01}})
      ]);

      const {text, images} = await search.run({query: 'the trip'});

      expect(text.map(result => result.name)).toStrictEqual(['the notes.md']);
      expect(images).toStrictEqual([]);
    });

    it('should keep the image group when the text group is empty', async () => {
      rerankedAs([aResult({bestMatch: {text: 'The best.', score: TEXT_FLOOR - 0.01}})]);
      pictureResultReader.getBestFirst.mockResolvedValue([
        aPictureResult({name: 'the beach.png'})
      ]);

      const {text, images} = await search.run({query: 'the beach'});

      expect(text).toStrictEqual([]);
      expect(images.map(result => result.name)).toStrictEqual(['the beach.png']);
    });

    it('should never gate the image group with the text Floor', async () => {
      search = aSearch({textFloor: 0.8, imageFloor: 0.05});
      pictureResultReader.getBestFirst.mockResolvedValue([
        aPictureResult({name: 'the beach.png', bestMatch: {score: 0.1}})
      ]);

      const {images} = await search.run({query: 'the beach'});

      expect(images.map(result => result.name)).toStrictEqual(['the beach.png']);
    });

    it('should never gate the text group with the image Floor', async () => {
      search = aSearch({textFloor: 0.8, imageFloor: 0.05});
      rerankedAs([aResult({bestMatch: {text: 'The best.', score: 0.1}})]);

      const {text} = await search.run({query: 'the trip'});

      expect(text).toStrictEqual([]);
    });

    it('should give no text Result when the best Match is under the Floor', async () => {
      rerankedAs([
        aResult({bestMatch: {text: 'The best.', score: TEXT_FLOOR - 0.01}}),
        aResult({bestMatch: {text: 'The second.', score: TEXT_FLOOR - 0.2}})
      ]);

      const {text} = await search.run({query: 'the trip'});

      expect(text).toStrictEqual([]);
    });

    it('should keep a Result under the Floor within the Margin, and remove one outside it, when the best Match reaches the Floor', async () => {
      rerankedAs([
        aResult({bestMatch: {text: 'The best.', score: TEXT_FLOOR}}),
        aResult({bestMatch: {text: 'The second.', score: TEXT_FLOOR - 0.01}}),
        aResult({bestMatch: {text: 'The third.', score: TEXT_FLOOR - 0.4}})
      ]);

      const {text} = await search.run({query: 'the trip'});

      expect(text.map(result => result.text)).toStrictEqual(['The best.', 'The second.']);
    });

    it('should keep a text Result at exactly the best score minus the Margin', async () => {
      const best = TEXT_FLOOR + 0.3;
      rerankedAs([
        aResult({bestMatch: {text: 'The best.', score: best}}),
        aResult({bestMatch: {text: 'At the edge.', score: best - TEXT_MARGIN}})
      ]);

      const {text} = await search.run({query: 'the trip'});

      expect(text.map(result => result.text)).toStrictEqual([
        'The best.',
        'At the edge.'
      ]);
    });

    it('should remove each text Result below the best score minus the Margin', async () => {
      const best = TEXT_FLOOR + 0.3;
      rerankedAs([
        aResult({bestMatch: {text: 'The best.', score: best}}),
        aResult({bestMatch: {text: 'Near.', score: best - 0.1}}),
        aResult({bestMatch: {text: 'Far.', score: best - TEXT_MARGIN - 0.01}}),
        aResult({bestMatch: {text: 'Farther.', score: best - 1}})
      ]);

      const {text} = await search.run({query: 'the trip'});

      expect(text.map(result => result.text)).toStrictEqual(['The best.', 'Near.']);
    });

    it('should cut the text group with the score of the Reranker, not the one of the text port', async () => {
      const [best, second] = [
        aResult({bestMatch: {text: 'The best.', score: TEXT_FLOOR + 0.3}}),
        aResult({bestMatch: {text: 'The second.', score: TEXT_FLOOR + 0.25}})
      ];
      resultReader.getBestFirst.mockResolvedValue([best, second]);
      reranker.rerank.mockResolvedValue([
        best,
        {...second, bestMatch: {...second.bestMatch, score: TEXT_FLOOR - 0.5}}
      ]);

      const {text} = await search.run({query: 'the trip'});

      expect(text.map(result => result.text)).toStrictEqual(['The best.']);
    });

    it('should never cut the image group with the text Margin', async () => {
      search = aSearch({textMargin: 0, imageMargin: 1});
      pictureResultReader.getBestFirst.mockResolvedValue([
        aPictureResult({name: 'the best.png', bestMatch: {score: IMAGE_FLOOR + 0.5}}),
        aPictureResult({name: 'the second.png', bestMatch: {score: IMAGE_FLOOR - 0.3}})
      ]);

      const {images} = await search.run({query: 'the beach'});

      expect(images.map(result => result.name)).toStrictEqual([
        'the best.png',
        'the second.png'
      ]);
    });

    it('should never cut the text group with the image Margin', async () => {
      search = aSearch({textMargin: 1, imageMargin: 0});
      rerankedAs([
        aResult({bestMatch: {text: 'The best.', score: TEXT_FLOOR + 0.5}}),
        aResult({bestMatch: {text: 'The second.', score: TEXT_FLOOR - 0.4}})
      ]);

      const {text} = await search.run({query: 'the trip'});

      expect(text.map(result => result.text)).toStrictEqual(['The best.', 'The second.']);
    });

    it('should gate the text group with the score of the Reranker, not the one of the text port', async () => {
      const result = aResult({bestMatch: {text: 'The best.', score: TEXT_FLOOR + 0.4}});
      resultReader.getBestFirst.mockResolvedValue([result]);
      reranker.rerank.mockResolvedValue([
        {...result, bestMatch: {...result.bestMatch, score: TEXT_FLOOR - 0.01}}
      ]);

      const {text} = await search.run({query: 'the trip'});

      expect(text).toStrictEqual([]);
    });

    it('should keep the text group when the Reranker reaches the Floor and the text port does not', async () => {
      const result = aResult({bestMatch: {text: 'The best.', score: TEXT_FLOOR - 0.4}});
      resultReader.getBestFirst.mockResolvedValue([result]);
      reranker.rerank.mockResolvedValue([
        {...result, bestMatch: {...result.bestMatch, score: TEXT_FLOOR}}
      ]);

      const {text} = await search.run({query: 'the trip'});

      expect(text.map(textResult => textResult.text)).toStrictEqual(['The best.']);
    });

    it('should compare only the first reranked Result with the Floor', async () => {
      rerankedAs([
        aResult({bestMatch: {text: 'The first.', score: TEXT_FLOOR - 0.01}}),
        aResult({bestMatch: {text: 'The second.', score: TEXT_FLOOR + 0.4}})
      ]);

      const {text} = await search.run({query: 'the trip'});

      expect(text).toStrictEqual([]);
    });

    it('should give no text Result when the port gives no Result', async () => {
      resultReader.getBestFirst.mockResolvedValue([]);

      const {text} = await search.run({query: 'the trip'});

      expect(text).toStrictEqual([]);
    });

    it.each([
      [
        'the text embedder',
        (error: Error): void => {
          textEmbedder.embedQuery.mockRejectedValue(error);
        }
      ],
      [
        'the text port',
        (error: Error): void => {
          resultReader.getBestFirst.mockRejectedValue(error);
        }
      ],
      [
        'the Reranker',
        (error: Error): void => {
          resultReader.getBestFirst.mockResolvedValue([aResult()]);
          reranker.rerank.mockRejectedValue(error);
        }
      ]
    ])('should keep the image group when %s fails', async (_, fail) => {
      const error = new Error('The text half broke');
      fail(error);
      const picture = aPictureResult();
      pictureResultReader.getBestFirst.mockResolvedValue([picture]);

      const {text, images} = await search.run({query: 'the trip'});

      expect(text).toStrictEqual([]);
      expect(images.map(image => image.resourceId)).toStrictEqual([picture.resourceId]);
    });

    it.each([
      [
        'the image embedder',
        (error: Error): void => {
          imageEmbedder.embedQuery.mockRejectedValue(error);
        }
      ],
      [
        'the image port',
        (error: Error): void => {
          pictureResultReader.getBestFirst.mockRejectedValue(error);
        }
      ]
    ])('should keep the text group when %s fails', async (_, fail) => {
      const error = new Error('The image half broke');
      fail(error);
      const result = aResult();
      resultReader.getBestFirst.mockResolvedValue([result]);

      const {text, images} = await search.run({query: 'the trip'});

      expect(text.map(textResult => textResult.resourceId)).toStrictEqual([
        result.resourceId
      ]);
      expect(images).toStrictEqual([]);
    });

    it('should give the failure of a group to the developer', async () => {
      const error = new Error('The image half broke');
      imageEmbedder.embedQuery.mockRejectedValue(error);

      await search.run({query: 'the trip'});

      expect(consoleError).toHaveBeenCalledWith(expect.any(String), error);
    });

    it('should refuse a Query that holds only spaces, and embed nothing', async () => {
      await expect(search.run({query: '   '})).rejects.toThrow(ValueObjectError);

      expect(textEmbedder.embedQuery).not.toHaveBeenCalled();
      expect(imageEmbedder.embedQuery).not.toHaveBeenCalled();
    });
  });
});
