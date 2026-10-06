import {ResourceNotFoundError} from '../../../../../src/core/resources/domain/errors/ResourceNotFoundError';
import type {ResourceRepository} from '../../../../../src/core/resources/domain/ResourceRepository';
import {ResourceId} from '../../../../../src/core/resources/domain/value-objects/ResourceId';
import type {Match} from '../../../../../src/core/search/domain/Match';
import type {ResultReader} from '../../../../../src/core/search/domain/ResultReader';
import type {Reranker} from '../../../../../src/core/search/domain/services/Reranker';
import {GetMatches} from '../../../../../src/core/search/use-cases/GetMatches';
import {ValueObjectError} from '../../../../../src/core/shared/domain/errors/ValueObjectError';
import type {TextEmbedder} from '../../../../../src/core/shared/domain/services/TextEmbedder';
import {ImageResourceBuilder} from '../../../../utils/builders/image-resource/ImageResourceBuilder';
import {TextResourceBuilder} from '../../../../utils/builders/text-resource/TextResourceBuilder';
import {type MockProxy, mock} from '../../../../utils/mock';
import {StringMother} from '../../../../utils/object-mother/StringMother';
import {VectorMother} from '../../../../utils/object-mother/VectorMother';

const TEXT_FLOOR = -0.3;
const MATCHES_LIMIT = 3;

const aMatch = (text: string, score: number): Match => ({text, score});

describe('GetMatches', () => {
  let resourceRepository: MockProxy<ResourceRepository>;
  let textEmbedder: MockProxy<TextEmbedder>;
  let resultReader: MockProxy<ResultReader>;
  let reranker: MockProxy<Reranker>;
  let getMatches: GetMatches;
  let id: string;

  beforeEach(() => {
    resourceRepository = mock<ResourceRepository>();
    textEmbedder = mock<TextEmbedder>();
    resultReader = mock<ResultReader>();
    reranker = mock<Reranker>();
    textEmbedder.embedQuery.mockResolvedValue(VectorMother.random());
    resultReader.getMatchesBestFirst.mockResolvedValue([]);
    reranker.rerankMatches.mockImplementation(async (_, matches) => [...matches]);
    getMatches = new GetMatches({
      resourceRepository,
      textEmbedder,
      resultReader,
      reranker,
      textFloor: TEXT_FLOOR,
      matchesLimit: MATCHES_LIMIT
    });
    id = StringMother.randomUuid();
    resourceRepository.find.mockResolvedValue(
      TextResourceBuilder.aTextResource().build()
    );
  });

  const givenTheReranked = (matches: Match[]): void => {
    resultReader.getMatchesBestFirst.mockResolvedValue(matches);
    reranker.rerankMatches.mockResolvedValue(matches);
  };

  describe('#run', () => {
    it('should embed the Query exactly as the user typed it', async () => {
      await getMatches.run({id, query: '  Animales ACUÁTICOS '});

      expect(textEmbedder.embedQuery).toHaveBeenCalledWith('  Animales ACUÁTICOS ');
    });

    it('should give the Resource identifier and the Vector of the Query to the port', async () => {
      const vector = VectorMother.random();
      textEmbedder.embedQuery.mockResolvedValue(vector);

      await getMatches.run({id, query: 'the trip'});

      expect(resultReader.getMatchesBestFirst).toHaveBeenCalledWith(
        ResourceId.of({value: id}),
        vector
      );
    });

    it('should give the Query and the Matches of the port to the Reranker', async () => {
      const matches = [aMatch('The best.', 0.9), aMatch('The second.', 0.8)];
      resultReader.getMatchesBestFirst.mockResolvedValue(matches);

      await getMatches.run({id, query: '  Animales ACUÁTICOS '});

      expect(reranker.rerankMatches).toHaveBeenCalledWith(
        '  Animales ACUÁTICOS ',
        matches
      );
    });

    it('should give the Matches in the order of the Reranker', async () => {
      resultReader.getMatchesBestFirst.mockResolvedValue([
        aMatch('The first.', 0.9),
        aMatch('The second.', 0.8),
        aMatch('The third.', 0.7)
      ]);
      reranker.rerankMatches.mockResolvedValue([
        aMatch('The third.', 2),
        aMatch('The first.', 1),
        aMatch('The second.', 0)
      ]);

      const rows = await getMatches.run({id, query: 'the trip'});

      expect(rows).toStrictEqual([
        {text: 'The third.'},
        {text: 'The first.'},
        {text: 'The second.'}
      ]);
    });

    it('should give no Match when the best Match is under the Floor', async () => {
      givenTheReranked([aMatch('The best.', -0.31), aMatch('The second.', -1)]);

      expect(await getMatches.run({id, query: 'the trip'})).toStrictEqual([]);
    });

    it('should remove each Match under the Floor, and keep a Match equal to it', async () => {
      givenTheReranked([
        aMatch('The best.', 1.5),
        aMatch('At the Floor.', TEXT_FLOOR),
        aMatch('Under the Floor.', -0.31)
      ]);

      const rows = await getMatches.run({id, query: 'the trip'});

      expect(rows).toStrictEqual([{text: 'The best.'}, {text: 'At the Floor.'}]);
    });

    it('should give the limit of Matches at most, the best ones', async () => {
      givenTheReranked([
        aMatch('The first.', 4),
        aMatch('The second.', 3),
        aMatch('The third.', 2),
        aMatch('The fourth.', 1)
      ]);

      const rows = await getMatches.run({id, query: 'the trip'});

      expect(rows).toStrictEqual([
        {text: 'The first.'},
        {text: 'The second.'},
        {text: 'The third.'}
      ]);
    });

    it('should not call the Reranker when the port gives no Match', async () => {
      expect(await getMatches.run({id, query: 'the trip'})).toStrictEqual([]);

      expect(reranker.rerankMatches).not.toHaveBeenCalled();
    });

    it('should give the page of a Match that has one, and no score', async () => {
      givenTheReranked([{text: 'The text on page four.', page: 4, score: 0.9}]);

      const rows = await getMatches.run({id, query: 'the trip'});

      expect(rows).toStrictEqual([{text: 'The text on page four.', page: 4}]);
    });

    it('should refuse a Query that holds only spaces, and embed nothing', async () => {
      await expect(getMatches.run({id, query: '   '})).rejects.toThrow(ValueObjectError);

      expect(textEmbedder.embedQuery).not.toHaveBeenCalled();
    });

    it('should refuse an identifier that is not a UUID, and embed nothing', async () => {
      await expect(getMatches.run({id: 'not-a-uuid', query: 'the trip'})).rejects.toThrow(
        ValueObjectError
      );

      expect(textEmbedder.embedQuery).not.toHaveBeenCalled();
    });

    it('should look for the Text Resource that holds the identifier', async () => {
      await getMatches.run({id, query: 'the trip'});

      expect(resourceRepository.find).toHaveBeenCalledWith(ResourceId.of({value: id}));
    });

    it('should refuse an identifier that no Resource holds, and embed nothing', async () => {
      resourceRepository.find.mockResolvedValue(undefined);

      await expect(getMatches.run({id, query: 'the trip'})).rejects.toThrow(
        ResourceNotFoundError
      );

      expect(textEmbedder.embedQuery).not.toHaveBeenCalled();
    });

    it('should refuse an identifier that an Image Resource holds, and embed nothing', async () => {
      const imageResource = ImageResourceBuilder.anImageResource().build();
      resourceRepository.find.mockResolvedValue(imageResource);

      await expect(
        getMatches.run({id: imageResource.id.value, query: 'the trip'})
      ).rejects.toThrow(ResourceNotFoundError);

      expect(textEmbedder.embedQuery).not.toHaveBeenCalled();
    });
  });
});
