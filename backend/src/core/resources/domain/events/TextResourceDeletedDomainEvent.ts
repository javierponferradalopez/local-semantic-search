import {DomainEvent} from '../../../shared/domain/DomainEvent';

type ConstructorParams = {aggregateId: string};

export class TextResourceDeletedDomainEvent extends DomainEvent {
  public constructor(params: ConstructorParams) {
    super(params);
  }
}
