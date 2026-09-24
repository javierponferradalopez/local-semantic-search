import type {ReasonCode} from 'contract/ReasonCode';
import {DomainEvent} from '../../../shared/domain/DomainEvent';

type ConstructorParams = {aggregateId: string; reason: ReasonCode};

export class TextResourceIngestFailedDomainEvent extends DomainEvent {
  public static readonly EVENT_NAME = 'ingestion.text_resource.ingest_failed';

  private readonly _reason: ReasonCode;

  public constructor({aggregateId, reason}: ConstructorParams) {
    super({aggregateId});
    this._reason = reason;
  }

  public get reason(): ReasonCode {
    return this._reason;
  }

  public get eventName(): typeof TextResourceIngestFailedDomainEvent.EVENT_NAME {
    return TextResourceIngestFailedDomainEvent.EVENT_NAME;
  }
}
