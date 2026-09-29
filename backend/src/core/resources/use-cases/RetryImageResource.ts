import type {RetryImageResourceResponse} from 'contract/RetryImageResourceResponse';
import type {EventBus} from '../../shared/domain/services/EventBus';
import type {FileStore} from '../../shared/domain/services/FileStore';
import type {TransactionRunner} from '../../shared/domain/services/TransactionRunner';
import {ResourceNotFoundError} from '../domain/errors/ResourceNotFoundError';
import {ImageResource} from '../domain/ImageResource';
import type {ResourceRepository} from '../domain/ResourceRepository';
import {ResourceId} from '../domain/value-objects/ResourceId';
import {resourceRowOf} from './resourceRowOf';

type ConstructorParams = {
  resourceRepository: ResourceRepository;
  fileStore: FileStore;
  eventBus: EventBus;
  transactionRunner: TransactionRunner;
};

type RunParams = {id: string};

export class RetryImageResource {
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

  public async run({id}: RunParams): Promise<RetryImageResourceResponse> {
    const imageResource = await this.transactionRunner.run(() =>
      this.retry(ResourceId.of({value: id}))
    );

    void this.eventBus.publish(imageResource.pullEvents());

    return resourceRowOf({
      resource: imageResource.toPrimitives(),
      fileStore: this.fileStore
    });
  }

  private async retry(id: ResourceId): Promise<ImageResource> {
    const imageResource = await this.resourceRepository.find(id);

    if (!(imageResource instanceof ImageResource)) {
      throw ResourceNotFoundError.causeNoResourceHoldsTheIdentifier(id);
    }

    imageResource.retry();
    await this.resourceRepository.update(imageResource);

    return imageResource;
  }
}
