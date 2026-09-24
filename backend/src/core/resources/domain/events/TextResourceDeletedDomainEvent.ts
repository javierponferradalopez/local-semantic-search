import {DomainEvent} from '../../../shared/domain/DomainEvent';

type ConstructorParams = {aggregateId: string};

export class TextResourceDeletedDomainEvent extends DomainEvent {
  public static readonly EVENT_NAME = 'resources.text_resource.deleted';

  public constructor(params: ConstructorParams) {
    super(params);
  }

  public get eventName(): typeof TextResourceDeletedDomainEvent.EVENT_NAME {
    return TextResourceDeletedDomainEvent.EVENT_NAME;
  }
}
