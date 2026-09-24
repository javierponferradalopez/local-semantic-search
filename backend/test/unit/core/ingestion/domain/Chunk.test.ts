import {Chunk} from '../../../../../src/core/ingestion/domain/Chunk';
import {CUT} from '../../../../../src/core/ingestion/domain/Cut';
import {ChunkCreatedDomainEvent} from '../../../../../src/core/ingestion/domain/events/ChunkCreatedDomainEvent';
import {ChunkText} from '../../../../../src/core/ingestion/domain/value-objects/ChunkText';
import {ResourceId} from '../../../../../src/core/resources/domain/value-objects/ResourceId';
import {ChunkBuilder} from '../../../../utils/builders/chunk/ChunkBuilder';

const aCreatedChunk = (resourceId: ResourceId): Chunk =>
  Chunk.create({
    resourceId,
    text: ChunkText.of({value: 'The cut follows the structure.'}),
    page: 3,
    position: 7
  });

describe('Chunk', () => {
  describe('.create', () => {
    it('should keep the identifier of its Resource, its text, its page, its position and the cut version in force', () => {
      const resourceId = ResourceId.random();

      const chunk = aCreatedChunk(resourceId);

      expect(chunk.toPrimitives()).toEqual({
        resourceId: resourceId.value,
        text: 'The cut follows the structure.',
        page: 3,
        position: 7,
        cutVersion: CUT.version
      });
    });

    it('should register ChunkCreated with its Resource, its position and its cut version', () => {
      const resourceId = ResourceId.random();

      const [event] = aCreatedChunk(resourceId)
        .pullEvents()
        .filter(pulled => pulled instanceof ChunkCreatedDomainEvent);

      expect(event?.aggregateId).toBe(resourceId.value);
      expect(event?.position).toBe(7);
      expect(event?.cutVersion).toBe(CUT.version);
    });
  });

  describe('.fromPrimitives', () => {
    it('should register no event, because it rebuilds a Chunk that exists', () => {
      const chunk = ChunkBuilder.aChunk().build();

      expect(chunk.pullEvents()).toEqual([]);
    });
  });

  describe('#toPrimitives', () => {
    it('should give no page when the Content type has no pages', () => {
      const chunk = ChunkBuilder.aChunk().build();

      expect(chunk.toPrimitives()).not.toHaveProperty('page');
    });

    it('should give the page 0, which is a page and not its absence', () => {
      const chunk = ChunkBuilder.aChunk().withPage(0).build();

      expect(chunk.toPrimitives().page).toBe(0);
    });

    it('should keep the cut version it was stored with', () => {
      const chunk = ChunkBuilder.aChunk()
        .withCutVersion(CUT.version + 1)
        .build();

      expect(chunk.toPrimitives().cutVersion).toBe(CUT.version + 1);
    });
  });
});
