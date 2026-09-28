import {ResourceId} from '../../../../../src/core/resources/domain/value-objects/ResourceId';
import type {ResultReader} from '../../../../../src/core/search/domain/ResultReader';
import {GetMatches} from '../../../../../src/core/search/use-cases/GetMatches';
import {ValueObjectError} from '../../../../../src/core/shared/domain/errors/ValueObjectError';
import type {TextEmbedder} from '../../../../../src/core/shared/domain/services/TextEmbedder';
import {type MockProxy, mock} from '../../../../utils/mock';
import {StringMother} from '../../../../utils/object-mother/StringMother';
import {VectorMother} from '../../../../utils/object-mother/VectorMother';

describe('GetMatches', () => {
  let textEmbedder: MockProxy<TextEmbedder>;
  let resultReader: MockProxy<ResultReader>;
  let getMatches: GetMatches;
  let id: string;

  beforeEach(() => {
    textEmbedder = mock<TextEmbedder>();
    resultReader = mock<ResultReader>();
    textEmbedder.embedQuery.mockResolvedValue(VectorMother.random());
    resultReader.getMatchesBestFirst.mockResolvedValue([]);
    getMatches = new GetMatches({textEmbedder, resultReader});
    id = StringMother.randomUuid();
  });

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

    it('should give every Match of the port in its order, the far ones too', async () => {
      resultReader.getMatchesBestFirst.mockResolvedValue([
        {text: 'The best.', score: 0.9},
        {text: 'The second.', score: 0.3},
        {text: 'The third.', score: -0.2}
      ]);

      const rows = await getMatches.run({id, query: 'the trip'});

      expect(rows).toStrictEqual([
        {text: 'The best.'},
        {text: 'The second.'},
        {text: 'The third.'}
      ]);
    });

    it('should give the page of a Match that has one, and no score', async () => {
      resultReader.getMatchesBestFirst.mockResolvedValue([
        {text: 'The text on page four.', page: 4, score: 0.9}
      ]);

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
  });
});
