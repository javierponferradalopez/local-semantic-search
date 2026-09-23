import type {RetryTextResourceResponse} from 'contract/RetryTextResourceResponse';
import type {EventBus} from '../../shared/domain/services/EventBus';
import type {FileStore} from '../../shared/domain/services/FileStore';
import type {TransactionRunner} from '../../shared/domain/services/TransactionRunner';
import {ResourceNotFoundError} from '../domain/errors/ResourceNotFoundError';
import type {ResourceRepository} from '../domain/ResourceRepository';
import type {TextResource} from '../domain/TextResource';
import {ResourceId} from '../domain/value-objects/ResourceId';
import {resourceRowOf} from './resourceRowOf';

type ConstructorParams = {
  resourceRepository: ResourceRepository;
  fileStore: FileStore;
  eventBus: EventBus;
  transactionRunner: TransactionRunner;
};

type RunParams = {id: string};

export class RetryTextResource {
  private readonly resourceRepository: ResourceRepository;
  private readonly fileStore: FileStore;
  private readonly eventBus: EventBus;
  private readonly transactionRunner: TransactionRunner;

  public constructor(params: ConstructorParams) {
    this.resourceRepository = params.resourceRepository;
    this.fileStore = params.fileStore;
    this.eventBus = params.eventBus;
    this.transactionRunner = params.transactionRunner;
  }

  public async run({id}: RunParams): Promise<RetryTextResourceResponse> {
    const textResource = await this.transactionRunner.run(() =>
      this.retry(ResourceId.of({value: id}))
    );

    await this.eventBus.publish(textResource.pullEvents());

    return resourceRowOf({
      resource: textResource.toPrimitives(),
      fileStore: this.fileStore
    });
  }

  private async retry(id: ResourceId): Promise<TextResource> {
    const textResource = await this.resourceRepository.find(id);

    if (textResource === undefined) {
      throw ResourceNotFoundError.causeNoResourceHoldsTheIdentifier(id);
    }

    textResource.retry();
    await this.resourceRepository.save(textResource);

    return textResource;
  }
}
