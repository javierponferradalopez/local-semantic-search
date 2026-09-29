import type {CreateImageResourceResponse} from 'contract/CreateImageResourceResponse';
import type {EventBus} from '../../shared/domain/services/EventBus';
import type {FileStore} from '../../shared/domain/services/FileStore';
import type {TransactionRunner} from '../../shared/domain/services/TransactionRunner';
import {FileKey} from '../../shared/domain/value-objects/FileKey';
import {DuplicateResourceError} from '../domain/errors/DuplicateResourceError';
import {ImageResource} from '../domain/ImageResource';
import type {ResourceRepository} from '../domain/ResourceRepository';
import type {ContentTypeResolver} from '../domain/services/ContentTypeResolver';
import {Checksum} from '../domain/value-objects/Checksum';
import {CreatedAt} from '../domain/value-objects/CreatedAt';
import {ResourceId} from '../domain/value-objects/ResourceId';
import {ResourceName} from '../domain/value-objects/ResourceName';
import {resourceRowOf} from './resourceRowOf';

type ConstructorParams = {
  resourceRepository: ResourceRepository;
  fileStore: FileStore;
  eventBus: EventBus;
  transactionRunner: TransactionRunner;
  contentTypeResolver: ContentTypeResolver;
};

type RunParams = {name: string; bytes: Buffer};

const KEY_PREFIX = 'resources';

export class CreateImageResource {
  private readonly resourceRepository: ResourceRepository;
  private readonly fileStore: FileStore;
  private readonly eventBus: EventBus;
  private readonly transactionRunner: TransactionRunner;
  private readonly contentTypeResolver: ContentTypeResolver;

  public constructor(params: ConstructorParams) {
    this.resourceRepository = params.resourceRepository;
    this.fileStore = params.fileStore;
    this.eventBus = params.eventBus;
    this.transactionRunner = params.transactionRunner;
    this.contentTypeResolver = params.contentTypeResolver;
  }

  public async run(params: RunParams): Promise<CreateImageResourceResponse> {
    const imageResource = await this.transactionRunner.run(() => this.land(params));

    void this.eventBus.publish(imageResource.pullEvents());

    return resourceRowOf({
      resource: imageResource.toPrimitives(),
      fileStore: this.fileStore
    });
  }

  private async land({name, bytes}: RunParams): Promise<ImageResource> {
    const checksum = Checksum.ofBytes({bytes});
    const stored = await this.resourceRepository.findImageResourceByChecksum(checksum);

    if (stored !== undefined) {
      throw DuplicateResourceError.causeTheBytesAreAlreadyStored(stored);
    }

    const imageResource = this.imageResourceOf({name, checksum});

    await this.resourceRepository.create(imageResource);
    await this.fileStore.store(imageResource.fileKey, bytes);

    return imageResource;
  }

  private imageResourceOf({
    name,
    checksum
  }: {
    name: string;
    checksum: Checksum;
  }): ImageResource {
    const id = ResourceId.random();
    const resourceName = ResourceName.of({value: name});

    return ImageResource.create({
      id,
      name: resourceName,
      contentType: this.contentTypeResolver.resolveImage(resourceName.value),
      fileKey: FileKey.of({value: `${KEY_PREFIX}/${id.value}/${resourceName.value}`}),
      checksum,
      createdAt: CreatedAt.of({value: new Date()})
    });
  }
}
