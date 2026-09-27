import {TextResourceDeletedDomainEvent} from '../../resources/domain/events/TextResourceDeletedDomainEvent';
import {ResourceId} from '../../resources/domain/value-objects/ResourceId';
import type {DomainEventHandler} from '../../shared/domain/DomainEventHandler';
import type {ChunkRepository} from '../domain/ChunkRepository';

type ConstructorParams = {chunkRepository: ChunkRepository};

// A deletion is a business operation by event, not a cascade in the database (ADR-0020).
export class DeleteChunksOnTextResourceDeleted
  implements DomainEventHandler<TextResourceDeletedDomainEvent>
{
  private readonly chunkRepository: ChunkRepository;

  public constructor(params: ConstructorParams) {
    this.chunkRepository = params.chunkRepository;
  }

  public subscribeTo(): [typeof TextResourceDeletedDomainEvent] {
    return [TextResourceDeletedDomainEvent];
  }

  public async handle(event: TextResourceDeletedDomainEvent): Promise<void> {
    await this.chunkRepository.deleteManyByResourceId(
      ResourceId.of({value: event.aggregateId})
    );
  }
}
