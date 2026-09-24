type ConstructorParams = {aggregateId: string};

export abstract class DomainEvent {
  private readonly _aggregateId: string;

  protected constructor({aggregateId}: ConstructorParams) {
    this._aggregateId = aggregateId;
  }

  public abstract get eventName(): string;

  public get aggregateId(): string {
    return this._aggregateId;
  }
}
