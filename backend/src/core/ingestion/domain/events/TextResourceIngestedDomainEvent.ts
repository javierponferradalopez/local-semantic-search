import {DomainEvent} from '../../../shared/domain/DomainEvent';

type ConstructorParams = {aggregateId: string};

export class TextResourceIngestedDomainEvent extends DomainEvent {
  public constructor(params: ConstructorParams) {
    super(params);
  }
}
