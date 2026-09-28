import type {Result} from '../../../../../src/core/search/domain/Result';
import type {ResultReader} from '../../../../../src/core/search/domain/ResultReader';
import {Search} from '../../../../../src/core/search/use-cases/Search';
import {ValueObjectError} from '../../../../../src/core/shared/domain/errors/ValueObjectError';
import type {FileStore} from '../../../../../src/core/shared/domain/services/FileStore';
import type {TextEmbedder} from '../../../../../src/core/shared/domain/services/TextEmbedder';
import {type MockProxy, mock} from '../../../../utils/mock';
import {StringMother} from '../../../../utils/object-mother/StringMother';
import {VectorMother} from '../../../../utils/object-mother/VectorMother';

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

describe('Search', () => {
  let textEmbedder: MockProxy<TextEmbedder>;
  let resultReader: MockProxy<ResultReader>;
  let fileStore: MockProxy<FileStore>;
  let search: Search;

  beforeEach(() => {
    textEmbedder = mock<TextEmbedder>();
    resultReader = mock<ResultReader>();
    fileStore = mock<FileStore>();
    textEmbedder.embedQuery.mockResolvedValue(VectorMother.random());
    resultReader.getBestFirst.mockResolvedValue([]);
    fileStore.urlOf.mockImplementation(fileKey => `/files/${fileKey.value}`);
    search = new Search({textEmbedder, resultReader, fileStore});
  });

  describe('#run', () => {
    it('should embed the Query exactly as the user typed it', async () => {
      await search.run({query: '  Animales ACUÁTICOS '});

      expect(textEmbedder.embedQuery).toHaveBeenCalledWith('  Animales ACUÁTICOS ');
    });

    it('should give the Vector of the Query to the port', async () => {
      const vector = VectorMother.random();
      textEmbedder.embedQuery.mockResolvedValue(vector);

      await search.run({query: 'the trip'});

      expect(resultReader.getBestFirst).toHaveBeenCalledWith(vector);
    });

    it('should give the Results of the port in their order', async () => {
      resultReader.getBestFirst.mockResolvedValue([
        aResult({name: 'the best.md'}),
        aResult({name: 'the second.md'}),
        aResult({name: 'the third.md'})
      ]);

      const {text} = await search.run({query: 'the trip'});

      expect(text.map(result => result.name)).toStrictEqual([
        'the best.md',
        'the second.md',
        'the third.md'
      ]);
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

    it('should give no score', async () => {
      resultReader.getBestFirst.mockResolvedValue([aResult()]);

      const {text} = await search.run({query: 'the trip'});

      expect(text[0]).not.toHaveProperty('score');
    });

    it('should give no image', async () => {
      resultReader.getBestFirst.mockResolvedValue([aResult()]);

      const {images} = await search.run({query: 'the trip'});

      expect(images).toStrictEqual([]);
    });

    it('should refuse a Query that holds only spaces, and embed nothing', async () => {
      await expect(search.run({query: '   '})).rejects.toThrow(ValueObjectError);

      expect(textEmbedder.embedQuery).not.toHaveBeenCalled();
    });
  });
});
