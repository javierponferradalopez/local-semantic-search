import {DomainEvent} from '../../../shared/domain/DomainEvent';

type ConstructorParams = {aggregateId: string};

export class PictureCreatedDomainEvent extends DomainEvent {
  public static readonly EVENT_NAME = 'ingestion.picture.created';

  public constructor(params: ConstructorParams) {
    super(params);
  }

  public get eventName(): typeof PictureCreatedDomainEvent.EVENT_NAME {
    return PictureCreatedDomainEvent.EVENT_NAME;
  }
}
