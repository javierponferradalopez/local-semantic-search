import type {EventBus} from '../../shared/domain/services/EventBus';
import type {FileStore} from '../../shared/domain/services/FileStore';
import type {TransactionRunner} from '../../shared/domain/services/TransactionRunner';
import {ResourceNotFoundError} from '../domain/errors/ResourceNotFoundError';
import type {ImageResource} from '../domain/ImageResource';
import type {ResourceRepository} from '../domain/ResourceRepository';
import type {TextResource} from '../domain/TextResource';
import {ResourceId} from '../domain/value-objects/ResourceId';

type ConstructorParams = {
  resourceRepository: ResourceRepository;
  fileStore: FileStore;
  eventBus: EventBus;
  transactionRunner: TransactionRunner;
};

type RunParams = {id: string};

export class DeleteResource {
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

  public async run({id}: RunParams): Promise<void> {
    const resource = await this.transactionRunner.run(() =>
      this.remove(ResourceId.of({value: id}))
    );

    void this.eventBus.publish(resource.pullEvents());
  }

  private async remove(id: ResourceId): Promise<ImageResource | TextResource> {
    const resource = await this.resourceRepository.find(id);

    if (resource === undefined) {
      throw ResourceNotFoundError.causeNoResourceHoldsTheIdentifier(id);
    }

    resource.delete();
    await this.resourceRepository.delete(resource);
    // The File goes last: the transaction can put the row back, and nothing puts the File back.
    await this.fileStore.delete(resource.fileKey);

    return resource;
  }
}
