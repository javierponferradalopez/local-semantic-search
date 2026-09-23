import type {DomainEvent} from '../domain/DomainEvent';
import type {EventBus} from '../domain/services/EventBus';

type Subscriber<TEvent extends DomainEvent> = (event: TEvent) => Promise<void>;

type DomainEventClass<TEvent extends DomainEvent> = abstract new (
  ...args: never[]
) => TEvent;

export class InProcessEventBus implements EventBus {
  private readonly subscribers = new Map<string, Subscriber<DomainEvent>[]>();

  public subscribe<TEvent extends DomainEvent>(
    event: DomainEventClass<TEvent>,
    subscriber: Subscriber<TEvent>
  ): void {
    const subscribers = this.subscribers.get(event.name) ?? [];

    this.subscribers.set(event.name, [
      ...subscribers,
      subscriber as Subscriber<DomainEvent>
    ]);
  }

  public publish(events: DomainEvent[]): Promise<void> {
    for (const event of events) {
      for (const subscriber of this.subscribersOf(event)) {
        void subscriber(event).catch((error: unknown) => {
          console.error(`A subscriber of ${event.constructor.name} broke`, error);
        });
      }
    }

    return Promise.resolve();
  }

  private subscribersOf(event: DomainEvent): Subscriber<DomainEvent>[] {
    return this.subscribers.get(event.constructor.name) ?? [];
  }
}
