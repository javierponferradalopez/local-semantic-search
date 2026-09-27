import type {ChunkRepository} from '../../../../../src/core/ingestion/domain/ChunkRepository';
import {DeleteChunksOnTextResourceDeleted} from '../../../../../src/core/ingestion/use-cases/DeleteChunksOnTextResourceDeleted';
import {TextResourceDeletedDomainEvent} from '../../../../../src/core/resources/domain/events/TextResourceDeletedDomainEvent';
import {type MockProxy, mock} from '../../../../utils/mock';
import {StringMother} from '../../../../utils/object-mother/StringMother';

describe('DeleteChunksOnTextResourceDeleted', () => {
  let chunkRepository: MockProxy<ChunkRepository>;
  let handler: DeleteChunksOnTextResourceDeleted;

  beforeEach(() => {
    chunkRepository = mock<ChunkRepository>();

    handler = new DeleteChunksOnTextResourceDeleted({chunkRepository});
  });

  describe('#subscribeTo', () => {
    it('should subscribe to TextResourceDeletedDomainEvent', () => {
      expect(handler.subscribeTo()).toStrictEqual([TextResourceDeletedDomainEvent]);
    });
  });

  describe('#handle', () => {
    it('should delete the Chunks and the Vectors of the Resource', async () => {
      const aggregateId = StringMother.randomUuid();

      await handler.handle(new TextResourceDeletedDomainEvent({aggregateId}));

      expect(chunkRepository.deleteManyByResourceId).toHaveBeenCalledTimes(1);
      expect(chunkRepository.deleteManyByResourceId.mock.calls[0]?.[0].value).toBe(
        aggregateId
      );
    });
  });
});
