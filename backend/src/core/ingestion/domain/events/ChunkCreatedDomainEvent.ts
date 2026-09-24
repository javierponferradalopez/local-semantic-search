import {DomainEvent} from '../../../shared/domain/DomainEvent';

type ConstructorParams = {aggregateId: string; position: number; cutVersion: number};

export class ChunkCreatedDomainEvent extends DomainEvent {
  public static readonly EVENT_NAME = 'ingestion.chunk.created';

  private readonly _position: number;
  private readonly _cutVersion: number;

  public constructor({aggregateId, position, cutVersion}: ConstructorParams) {
    super({aggregateId});
    this._position = position;
    this._cutVersion = cutVersion;
  }

  public get position(): number {
    return this._position;
  }

  public get cutVersion(): number {
    return this._cutVersion;
  }

  public get eventName(): typeof ChunkCreatedDomainEvent.EVENT_NAME {
    return ChunkCreatedDomainEvent.EVENT_NAME;
  }
}
