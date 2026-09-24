import type {DomainEvent} from '../DomainEvent';
import type {DomainEventHandler} from '../DomainEventHandler';

export interface EventBus {
  publish(events: DomainEvent[]): Promise<void>;
  subscribe(handler: DomainEventHandler): void;
}
