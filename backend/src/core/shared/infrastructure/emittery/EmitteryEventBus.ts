import Emittery from 'emittery';
import type {DomainEvent} from '../../domain/DomainEvent';
import type {DomainEventHandler} from '../../domain/DomainEventHandler';
import type {EventBus} from '../../domain/services/EventBus';

export class EmitteryEventBus implements EventBus {
  private readonly emitter = new Emittery<Record<string, DomainEvent>>();

  public publish(events: DomainEvent[]): Promise<void> {
    const published = Promise.all(
      events.map(event => this.emitter.emit(event.eventName, event))
    ).then(() => undefined);

    // On the returned promise, so a `void publish()` leaves no unhandled rejection (ADR-0024).
    published.catch((error: unknown) => {
      console.error('A handler of a domain event broke', error);
    });

    return published;
  }

  public subscribe(handler: DomainEventHandler): void {
    const eventNames = handler.subscribeTo().map(event => event.EVENT_NAME);

    this.emitter.on(eventNames, ({data}) => handler.handle(data));
  }
}
