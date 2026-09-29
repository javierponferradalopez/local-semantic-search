import {ResourceId} from '../../resources/domain/value-objects/ResourceId';
import {AggregateRoot} from '../../shared/domain/AggregateRoot';
import {FileKey} from '../../shared/domain/value-objects/FileKey';
import {PictureCreatedDomainEvent} from './events/PictureCreatedDomainEvent';

// No place (ADR-0009) and no Vector (ADR-0015).
type ConstructorParams = {
  resourceId: ResourceId;
  thumbnailKey: FileKey;
};

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

  public static create(params: ConstructorParams): Picture {
    const picture = new Picture(params);

    picture.registerEvent(
      new PictureCreatedDomainEvent({aggregateId: picture._resourceId.value})
    );

    return picture;
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
