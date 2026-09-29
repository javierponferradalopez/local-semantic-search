import type {ReasonCode} from 'contract/ReasonCode';
import {ImageResourceCreatedDomainEvent} from '../../resources/domain/events/ImageResourceCreatedDomainEvent';
import {ImageResourceRetriedDomainEvent} from '../../resources/domain/events/ImageResourceRetriedDomainEvent';
import type {ResourceRepository} from '../../resources/domain/ResourceRepository';
import {ResourceId} from '../../resources/domain/value-objects/ResourceId';
import type {DomainEvent} from '../../shared/domain/DomainEvent';
import type {DomainEventHandler} from '../../shared/domain/DomainEventHandler';
import type {EventBus} from '../../shared/domain/services/EventBus';
import type {FileStore} from '../../shared/domain/services/FileStore';
import type {ImageEmbedder} from '../../shared/domain/services/ImageEmbedder';
import {FileKey} from '../../shared/domain/value-objects/FileKey';
import {ImageTooLargeError} from '../domain/errors/ImageTooLargeError';
import {UnreadableFileError} from '../domain/errors/UnreadableFileError';
import {ImageResourceIngestedDomainEvent} from '../domain/events/ImageResourceIngestedDomainEvent';
import {ImageResourceIngestFailedDomainEvent} from '../domain/events/ImageResourceIngestFailedDomainEvent';
import type {ImageDecoder} from '../domain/ImageDecoder';
import {Picture} from '../domain/Picture';
import type {PictureRepository} from '../domain/PictureRepository';

type ImageResourceCreatedOrRetried =
  | ImageResourceCreatedDomainEvent
  | ImageResourceRetriedDomainEvent;

type ConstructorParams = {
  fileStore: FileStore;
  imageDecoder: ImageDecoder;
  imageEmbedder: ImageEmbedder;
  pictureRepository: PictureRepository;
  resourceRepository: ResourceRepository;
  eventBus: EventBus;
};

const THUMBNAIL_KEY_PREFIX = 'ingestion/thumbnails';

const thumbnailKeyOf = (resourceId: ResourceId): FileKey =>
  FileKey.of({value: `${THUMBNAIL_KEY_PREFIX}/${resourceId.value}.webp`});

export class IngestImageResourceOnImageResourceCreatedOrRetried
  implements DomainEventHandler<ImageResourceCreatedOrRetried>
{
  private readonly fileStore: FileStore;
  private readonly imageDecoder: ImageDecoder;
  private readonly imageEmbedder: ImageEmbedder;
  private readonly pictureRepository: PictureRepository;
  private readonly resourceRepository: ResourceRepository;
  private readonly eventBus: EventBus;

  public constructor(params: ConstructorParams) {
    this.fileStore = params.fileStore;
    this.imageDecoder = params.imageDecoder;
    this.imageEmbedder = params.imageEmbedder;
    this.pictureRepository = params.pictureRepository;
    this.resourceRepository = params.resourceRepository;
    this.eventBus = params.eventBus;
  }

  public subscribeTo(): [
    typeof ImageResourceCreatedDomainEvent,
    typeof ImageResourceRetriedDomainEvent
  ] {
    return [ImageResourceCreatedDomainEvent, ImageResourceRetriedDomainEvent];
  }

  public async handle(event: ImageResourceCreatedOrRetried): Promise<void> {
    const resourceId = ResourceId.of({value: event.aggregateId});

    const events = await this.ingest(resourceId, event).catch((error: unknown) => {
      // The detail is for the developer, and never reaches the event.
      console.error('The Ingest of a Resource failed', error);

      return [
        new ImageResourceIngestFailedDomainEvent({
          aggregateId: resourceId.value,
          reason: reasonOf(error)
        })
      ];
    });

    void this.eventBus.publish(events);
  }

  private async ingest(
    resourceId: ResourceId,
    event: ImageResourceCreatedOrRetried
  ): Promise<DomainEvent[]> {
    const thumbnailKey = thumbnailKeyOf(resourceId);

    await this.deleteTheOutput(resourceId, thumbnailKey);

    const bytes = await this.fileStore.read(FileKey.of({value: event.fileKey}));
    const {pixels, thumbnail} = await this.imageDecoder.decode(bytes, event.contentType);
    const vector = await this.imageEmbedder.embedPicture(pixels);
    const picture = Picture.create({resourceId, thumbnailKey});

    await this.fileStore.store(thumbnailKey, thumbnail);
    await this.pictureRepository.create({picture, vector});

    // A Delete during the Ingest can find no Picture to delete, so the Ingest deletes what it wrote.
    if ((await this.resourceRepository.find(resourceId)) === undefined) {
      await this.deleteTheOutput(resourceId, thumbnailKey);

      return [];
    }

    return [
      ...picture.pullEvents(),
      new ImageResourceIngestedDomainEvent({aggregateId: resourceId.value})
    ];
  }

  private async deleteTheOutput(
    resourceId: ResourceId,
    thumbnailKey: FileKey
  ): Promise<void> {
    await this.pictureRepository.deleteManyByResourceId(resourceId);
    await this.fileStore.delete(thumbnailKey);
  }
}

const reasonOf = (error: unknown): ReasonCode => {
  if (error instanceof ImageTooLargeError) {
    return 'image_too_large';
  }

  return error instanceof UnreadableFileError ? 'unreadable_file' : 'ingest_error';
};
