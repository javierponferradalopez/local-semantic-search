import {DomainEvent} from '../../../shared/domain/DomainEvent';

type ConstructorParams = {aggregateId: string};

export class TextResourceIngestedDomainEvent extends DomainEvent {
  public static readonly EVENT_NAME = 'ingestion.text_resource.ingested';

  public constructor(params: ConstructorParams) {
    super(params);
  }

  public get eventName(): typeof TextResourceIngestedDomainEvent.EVENT_NAME {
    return TextResourceIngestedDomainEvent.EVENT_NAME;
  }
}
