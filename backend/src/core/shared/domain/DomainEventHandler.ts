import type {DomainEvent} from './DomainEvent';

export type DomainEventClass<TEvent extends DomainEvent> = {
  readonly EVENT_NAME: TEvent['eventName'];
  readonly prototype: TEvent;
};

export interface DomainEventHandler<TEvent extends DomainEvent = DomainEvent> {
  subscribeTo(): DomainEventClass<TEvent>[];
  handle(event: TEvent): Promise<void>;
}
