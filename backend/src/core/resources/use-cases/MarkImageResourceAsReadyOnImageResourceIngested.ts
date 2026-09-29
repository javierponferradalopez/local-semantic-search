import {ImageResourceIngestedDomainEvent} from '../../ingestion/domain/events/ImageResourceIngestedDomainEvent';
import type {DomainEventHandler} from '../../shared/domain/DomainEventHandler';
import type {TransactionRunner} from '../../shared/domain/services/TransactionRunner';
import {ImageResource} from '../domain/ImageResource';
import type {ResourceRepository} from '../domain/ResourceRepository';
import {ResourceId} from '../domain/value-objects/ResourceId';

type ConstructorParams = {
  resourceRepository: ResourceRepository;
  transactionRunner: TransactionRunner;
};

export class MarkImageResourceAsReadyOnImageResourceIngested
  implements DomainEventHandler<ImageResourceIngestedDomainEvent>
{
  private readonly resourceRepository: ResourceRepository;
  private readonly transactionRunner: TransactionRunner;

  public constructor(params: ConstructorParams) {
    this.resourceRepository = params.resourceRepository;
    this.transactionRunner = params.transactionRunner;
  }

  public subscribeTo(): [typeof ImageResourceIngestedDomainEvent] {
    return [ImageResourceIngestedDomainEvent];
  }

  public async handle(event: ImageResourceIngestedDomainEvent): Promise<void> {
    await this.transactionRunner.run(() =>
      this.markAsReady(ResourceId.of({value: event.aggregateId}))
    );
  }

  private async markAsReady(id: ResourceId): Promise<void> {
    const imageResource = await this.resourceRepository.find(id);

    // Delete is allowed in every Ingest state, so the Resource can be gone (ADR-0018).
    if (!(imageResource instanceof ImageResource)) {
      return;
    }

    imageResource.markAsReady();
    await this.resourceRepository.update(imageResource);
  }
}
