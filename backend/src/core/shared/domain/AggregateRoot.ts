import type {DomainEvent} from './DomainEvent';

export abstract class AggregateRoot<TPrimitives> {
  private readonly events: DomainEvent[] = [];

  public abstract toPrimitives(): TPrimitives;

  public pullEvents(): DomainEvent[] {
    return this.events.splice(0);
  }

  protected registerEvent(event: DomainEvent): void {
    this.events.push(event);
  }
}
