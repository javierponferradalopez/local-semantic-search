import {ImageResourceDeletedDomainEvent} from '../../resources/domain/events/ImageResourceDeletedDomainEvent';
import {ResourceId} from '../../resources/domain/value-objects/ResourceId';
import type {DomainEventHandler} from '../../shared/domain/DomainEventHandler';
import type {FileStore} from '../../shared/domain/services/FileStore';
import {Picture} from '../domain/Picture';
import type {PictureRepository} from '../domain/PictureRepository';

type ConstructorParams = {pictureRepository: PictureRepository; fileStore: FileStore};

// A deletion is a business operation by event, not a cascade in the database (ADR-0020).
export class DeletePictureOnImageResourceDeleted
  implements DomainEventHandler<ImageResourceDeletedDomainEvent>
{
  private readonly pictureRepository: PictureRepository;
  private readonly fileStore: FileStore;

  public constructor(params: ConstructorParams) {
    this.pictureRepository = params.pictureRepository;
    this.fileStore = params.fileStore;
  }

  public subscribeTo(): [typeof ImageResourceDeletedDomainEvent] {
    return [ImageResourceDeletedDomainEvent];
  }

  public async handle(event: ImageResourceDeletedDomainEvent): Promise<void> {
    const resourceId = ResourceId.of({value: event.aggregateId});

    await this.pictureRepository.deleteManyByResourceId(resourceId);
    await this.fileStore.delete(Picture.thumbnailKeyOf(resourceId));
  }
}
