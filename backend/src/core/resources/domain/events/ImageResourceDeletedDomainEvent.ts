import {DomainEvent} from '../../../shared/domain/DomainEvent';

type ConstructorParams = {aggregateId: string};

export class ImageResourceDeletedDomainEvent extends DomainEvent {
  public static readonly EVENT_NAME = 'resources.image_resource.deleted';

  public constructor(params: ConstructorParams) {
    super(params);
  }

  public get eventName(): typeof ImageResourceDeletedDomainEvent.EVENT_NAME {
    return ImageResourceDeletedDomainEvent.EVENT_NAME;
  }
}
