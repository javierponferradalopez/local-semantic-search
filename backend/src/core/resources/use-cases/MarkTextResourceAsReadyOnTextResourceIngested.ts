import {TextResourceIngestedDomainEvent} from '../../ingestion/domain/events/TextResourceIngestedDomainEvent';
import type {DomainEventHandler} from '../../shared/domain/DomainEventHandler';
import type {TransactionRunner} from '../../shared/domain/services/TransactionRunner';
import type {ResourceRepository} from '../domain/ResourceRepository';
import {ResourceId} from '../domain/value-objects/ResourceId';

type ConstructorParams = {
  resourceRepository: ResourceRepository;
  transactionRunner: TransactionRunner;
};

export class MarkTextResourceAsReadyOnTextResourceIngested
  implements DomainEventHandler<TextResourceIngestedDomainEvent>
{
  private readonly resourceRepository: ResourceRepository;
  private readonly transactionRunner: TransactionRunner;

  public constructor(params: ConstructorParams) {
    this.resourceRepository = params.resourceRepository;
    this.transactionRunner = params.transactionRunner;
  }

  public subscribeTo(): [typeof TextResourceIngestedDomainEvent] {
    return [TextResourceIngestedDomainEvent];
  }

  public async handle(event: TextResourceIngestedDomainEvent): Promise<void> {
    await this.transactionRunner.run(() =>
      this.markAsReady(ResourceId.of({value: event.aggregateId}))
    );
  }

  private async markAsReady(id: ResourceId): Promise<void> {
    const textResource = await this.resourceRepository.find(id);

    // Delete is allowed in every Ingest state, so the Resource can be gone (ADR-0018).
    if (textResource === undefined) {
      return;
    }

    textResource.markAsReady();
    await this.resourceRepository.update(textResource);
  }
}
