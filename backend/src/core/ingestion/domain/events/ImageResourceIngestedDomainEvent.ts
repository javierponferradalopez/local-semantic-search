import {DomainEvent} from '../../../shared/domain/DomainEvent';

type ConstructorParams = {aggregateId: string};

export class ImageResourceIngestedDomainEvent extends DomainEvent {
  public static readonly EVENT_NAME = 'ingestion.image_resource.ingested';

  public constructor(params: ConstructorParams) {
    super(params);
  }

  public get eventName(): typeof ImageResourceIngestedDomainEvent.EVENT_NAME {
    return ImageResourceIngestedDomainEvent.EVENT_NAME;
  }
}
