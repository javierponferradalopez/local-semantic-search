import type {ReasonCode} from 'contract/ReasonCode';
import {DomainEvent} from '../../../shared/domain/DomainEvent';

type ConstructorParams = {aggregateId: string; reason: ReasonCode};

export class TextResourceIngestFailedDomainEvent extends DomainEvent {
  private readonly _reason: ReasonCode;

  public constructor({aggregateId, reason}: ConstructorParams) {
    super({aggregateId});
    this._reason = reason;
  }

  public get reason(): ReasonCode {
    return this._reason;
  }
}
