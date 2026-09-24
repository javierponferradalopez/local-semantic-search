import type {CreateTextResourceResponse} from 'contract/CreateTextResourceResponse';
import type {EventBus} from '../../shared/domain/services/EventBus';
import type {FileStore} from '../../shared/domain/services/FileStore';
import type {TransactionRunner} from '../../shared/domain/services/TransactionRunner';
import {FileKey} from '../../shared/domain/value-objects/FileKey';
import {DuplicateResourceError} from '../domain/errors/DuplicateResourceError';
import type {ResourceRepository} from '../domain/ResourceRepository';
import type {ContentTypeResolver} from '../domain/services/ContentTypeResolver';
import {TextResource} from '../domain/TextResource';
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

export class CreateTextResource {
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

  public async run(params: RunParams): Promise<CreateTextResourceResponse> {
    const textResource = await this.transactionRunner.run(() => this.land(params));

    void this.eventBus.publish(textResource.pullEvents());

    return resourceRowOf({
      resource: textResource.toPrimitives(),
      fileStore: this.fileStore
    });
  }

  private async land({name, bytes}: RunParams): Promise<TextResource> {
    const checksum = Checksum.ofBytes({bytes});
    const stored = await this.resourceRepository.findByChecksum(checksum);

    if (stored !== undefined) {
      throw DuplicateResourceError.causeTheBytesAreAlreadyStored(stored);
    }

    const textResource = this.textResourceOf({name, checksum});

    await this.resourceRepository.save(textResource);
    await this.fileStore.store(textResource.fileKey, bytes);

    return textResource;
  }

  private textResourceOf({
    name,
    checksum
  }: {
    name: string;
    checksum: Checksum;
  }): TextResource {
    const id = ResourceId.random();
    const resourceName = ResourceName.of({value: name});

    return TextResource.create({
      id,
      name: resourceName,
      contentType: this.contentTypeResolver.resolve(resourceName.value),
      fileKey: FileKey.of({value: `${KEY_PREFIX}/${id.value}/${resourceName.value}`}),
      checksum,
      createdAt: CreatedAt.of({value: new Date()})
    });
  }
}
