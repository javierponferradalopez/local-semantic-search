import {ImageResourceIngestFailedDomainEvent} from '../../ingestion/domain/events/ImageResourceIngestFailedDomainEvent';
import type {DomainEventHandler} from '../../shared/domain/DomainEventHandler';
import type {TransactionRunner} from '../../shared/domain/services/TransactionRunner';
import {ImageResource} from '../domain/ImageResource';
import type {ResourceRepository} from '../domain/ResourceRepository';
import {Reason} from '../domain/value-objects/Reason';
import {ResourceId} from '../domain/value-objects/ResourceId';

type ConstructorParams = {
  resourceRepository: ResourceRepository;
  transactionRunner: TransactionRunner;
};

export class MarkImageResourceAsFailedOnImageResourceIngestFailed
  implements DomainEventHandler<ImageResourceIngestFailedDomainEvent>
{
  private readonly resourceRepository: ResourceRepository;
  private readonly transactionRunner: TransactionRunner;

  public constructor(params: ConstructorParams) {
    this.resourceRepository = params.resourceRepository;
    this.transactionRunner = params.transactionRunner;
  }

  public subscribeTo(): [typeof ImageResourceIngestFailedDomainEvent] {
    return [ImageResourceIngestFailedDomainEvent];
  }

  public async handle(event: ImageResourceIngestFailedDomainEvent): Promise<void> {
    await this.transactionRunner.run(() =>
      this.markAsFailed(
        ResourceId.of({value: event.aggregateId}),
        Reason.of({value: event.reason})
      )
    );
  }

  private async markAsFailed(id: ResourceId, reason: Reason): Promise<void> {
    const imageResource = await this.resourceRepository.find(id);

    // Delete is allowed in every Ingest state, so the Resource can be gone (ADR-0018).
    if (!(imageResource instanceof ImageResource)) {
      return;
    }

    imageResource.markAsFailed({reason});
    await this.resourceRepository.update(imageResource);
  }
}
