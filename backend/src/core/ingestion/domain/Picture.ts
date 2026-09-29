import {ResourceId} from '../../resources/domain/value-objects/ResourceId';
import {AggregateRoot} from '../../shared/domain/AggregateRoot';
import {FileKey} from '../../shared/domain/value-objects/FileKey';
import {PictureCreatedDomainEvent} from './events/PictureCreatedDomainEvent';

// No place (ADR-0009) and no Vector (ADR-0015).
type ConstructorParams = {
  resourceId: ResourceId;
  thumbnailKey: FileKey;
};

const THUMBNAIL_KEY_PREFIX = 'ingestion/thumbnails';

export type PicturePrimitives = {
  resourceId: string;
  thumbnailKey: string;
};

export class Picture extends AggregateRoot<PicturePrimitives> {
  private readonly _resourceId: ResourceId;
  private readonly _thumbnailKey: FileKey;

  private constructor(params: ConstructorParams) {
    super();
    this._resourceId = params.resourceId;
    this._thumbnailKey = params.thumbnailKey;
  }

  // The key comes from the Resource, so the one the Picture stores is the one a delete finds.
  public static create({resourceId}: {resourceId: ResourceId}): Picture {
    const picture = new Picture({
      resourceId,
      thumbnailKey: Picture.thumbnailKeyOf(resourceId)
    });

    picture.registerEvent(
      new PictureCreatedDomainEvent({aggregateId: picture._resourceId.value})
    );

    return picture;
  }

  public static thumbnailKeyOf(resourceId: ResourceId): FileKey {
    return FileKey.of({value: `${THUMBNAIL_KEY_PREFIX}/${resourceId.value}.webp`});
  }

  public static fromPrimitives(primitives: PicturePrimitives): Picture {
    return new Picture({
      resourceId: ResourceId.fromPrimitive({value: primitives.resourceId}),
      thumbnailKey: FileKey.fromPrimitive({value: primitives.thumbnailKey})
    });
  }

  public toPrimitives(): PicturePrimitives {
    return {
      resourceId: this._resourceId.value,
      thumbnailKey: this._thumbnailKey.value
    };
  }
}
