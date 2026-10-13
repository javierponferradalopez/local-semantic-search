import type {Origin} from 'contract/Origin';
import Emittery from 'emittery';
import type {DomainEvent} from '../../domain/DomainEvent';
import type {DomainEventHandler} from '../../domain/DomainEventHandler';
import {NoSessionError} from '../../domain/errors/NoSessionError';
import type {EventBus} from '../../domain/services/EventBus';
import type {OperationRunner} from '../../domain/services/OperationRunner';
import type {SessionRunner} from '../../domain/services/SessionRunner';
import {Session} from '../../domain/value-objects/Session';

type ConstructorParams = {sessionRunner: SessionRunner; operationRunner: OperationRunner};

// Plain values, so an out-of-process bus can carry the Session too (ADR-0047).
type Envelope = {
  event: DomainEvent;
  metadata: {session: {id: string; origin: Origin} | null};
};

export class EmitteryEventBus implements EventBus {
  private readonly _sessionRunner: SessionRunner;
  private readonly _operationRunner: OperationRunner;
  private readonly emitter = new Emittery<Record<string, Envelope>>();

  public constructor({sessionRunner, operationRunner}: ConstructorParams) {
    this._sessionRunner = sessionRunner;
    this._operationRunner = operationRunner;
  }

  public publish(events: DomainEvent[]): Promise<void> {
    const metadata = {session: this.currentSessionOrNull()};
    const published = Promise.all(
      events.map(event => this.emitter.emit(event.eventName, {event, metadata}))
    ).then(() => undefined);

    // On the returned promise, so a `void publish()` leaves no unhandled rejection (ADR-0024).
    published.catch((error: unknown) => {
      console.error('A handler of a domain event broke', error);
    });

    return published;
  }

  public subscribe(handler: DomainEventHandler): void {
    const eventNames = handler.subscribeTo().map(event => event.EVENT_NAME);

    this.emitter.on(eventNames, ({data: {event, metadata}}) => {
      // Each handler is an operation of its own, so an Ingest has its own trace (ADR-0048).
      const runTheHandler = (): Promise<void> =>
        this._operationRunner.run(handler.constructor.name, () => handler.handle(event));

      if (metadata.session === null) {
        // A handler that stops halfway can leave corrupt data, so it runs also with no Session.
        console.warn(`A handler of ${event.eventName} runs with no Session`);

        return runTheHandler();
      }

      return this._sessionRunner.run(Session.of(metadata.session), runTheHandler);
    });
  }

  private currentSessionOrNull(): {id: string; origin: Origin} | null {
    try {
      const session = this._sessionRunner.current();

      return {id: session.id.value, origin: session.origin.value};
    } catch (error) {
      if (error instanceof NoSessionError) {
        return null;
      }

      throw error;
    }
  }
}
