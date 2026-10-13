import {TextResourceCreatedDomainEvent} from '../../../../../../src/core/resources/domain/events/TextResourceCreatedDomainEvent';
import {TextResourceDeletedDomainEvent} from '../../../../../../src/core/resources/domain/events/TextResourceDeletedDomainEvent';
import {TextResourceRetriedDomainEvent} from '../../../../../../src/core/resources/domain/events/TextResourceRetriedDomainEvent';
import type {DomainEvent} from '../../../../../../src/core/shared/domain/DomainEvent';
import type {
  DomainEventClass,
  DomainEventHandler
} from '../../../../../../src/core/shared/domain/DomainEventHandler';
import {NoSessionError} from '../../../../../../src/core/shared/domain/errors/NoSessionError';
import type {SessionRunner} from '../../../../../../src/core/shared/domain/services/SessionRunner';
import type {Session} from '../../../../../../src/core/shared/domain/value-objects/Session';
import {AsyncLocalStorageSessionRunner} from '../../../../../../src/core/shared/infrastructure/async-hooks/AsyncLocalStorageSessionRunner';
import {EmitteryEventBus} from '../../../../../../src/core/shared/infrastructure/emittery/EmitteryEventBus';
import {SessionMother} from '../../../../../utils/object-mother/SessionMother';
import {StringMother} from '../../../../../utils/object-mother/StringMother';

const anEventOfACreatedResource = (): TextResourceCreatedDomainEvent => {
  const aggregateId = StringMother.randomUuid();

  return new TextResourceCreatedDomainEvent({
    aggregateId,
    contentType: 'markdown',
    fileKey: `resources/${aggregateId}/the notes.md`
  });
};

const anEventOfARetriedResource = (): TextResourceRetriedDomainEvent => {
  const aggregateId = StringMother.randomUuid();

  return new TextResourceRetriedDomainEvent({
    aggregateId,
    contentType: 'markdown',
    fileKey: `resources/${aggregateId}/the notes.md`
  });
};

const aHandlerOf = (
  events: DomainEventClass<DomainEvent>[],
  handle: (event: DomainEvent) => Promise<void>
): DomainEventHandler => ({
  subscribeTo: (): DomainEventClass<DomainEvent>[] => events,
  handle
});

const aTick = (): Promise<void> => new Promise(resolve => setImmediate(resolve));

describe('EmitteryEventBus', () => {
  let sessionRunner: AsyncLocalStorageSessionRunner;
  let eventBus: EmitteryEventBus;

  beforeEach(() => {
    sessionRunner = new AsyncLocalStorageSessionRunner();
    eventBus = new EmitteryEventBus({sessionRunner});
  });

  const hasASession = (): boolean => {
    try {
      sessionRunner.current();

      return true;
    } catch (error) {
      if (error instanceof NoSessionError) {
        return false;
      }

      throw error;
    }
  };

  const publishInASession = (session: Session, events: DomainEvent[]): Promise<void> =>
    sessionRunner.run(session, () => eventBus.publish(events));

  describe('#publish', () => {
    it('should give the event to the handlers of its name alone', async () => {
      const ofCreated: string[] = [];
      const ofDeleted: string[] = [];
      eventBus.subscribe(
        aHandlerOf([TextResourceCreatedDomainEvent], async event => {
          ofCreated.push(event.aggregateId);
        })
      );
      eventBus.subscribe(
        aHandlerOf([TextResourceDeletedDomainEvent], async event => {
          ofDeleted.push(event.aggregateId);
        })
      );
      const event = anEventOfACreatedResource();

      await publishInASession(SessionMother.random(), [event]);

      expect(ofCreated).toStrictEqual([event.aggregateId]);
      expect(ofDeleted).toStrictEqual([]);
    });

    it('should give each event to a handler that subscribes to two names', async () => {
      const reached: string[] = [];
      eventBus.subscribe(
        aHandlerOf(
          [TextResourceCreatedDomainEvent, TextResourceRetriedDomainEvent],
          async event => {
            reached.push(event.aggregateId);
          }
        )
      );
      const created = anEventOfACreatedResource();
      const retried = anEventOfARetriedResource();

      await publishInASession(SessionMother.random(), [created, retried]);

      expect(reached.toSorted()).toStrictEqual(
        [created.aggregateId, retried.aggregateId].toSorted()
      );
    });

    it('should end when the handlers end', async () => {
      let hasEnded = false;
      eventBus.subscribe(
        aHandlerOf([TextResourceCreatedDomainEvent], async () => {
          await new Promise(resolve => setTimeout(resolve, 50));
          hasEnded = true;
        })
      );

      await publishInASession(SessionMother.random(), [anEventOfACreatedResource()]);

      expect(hasEnded).toBe(true);
    });

    it('should reach the other handlers when one of them throws, and reject', async () => {
      const reached: string[] = [];
      eventBus.subscribe(
        aHandlerOf([TextResourceCreatedDomainEvent], () =>
          Promise.reject(new Error('the handler broke'))
        )
      );
      eventBus.subscribe(
        aHandlerOf([TextResourceCreatedDomainEvent], async event => {
          reached.push(event.aggregateId);
        })
      );
      const event = anEventOfACreatedResource();

      await expect(publishInASession(SessionMother.random(), [event])).rejects.toThrow();
      expect(reached).toStrictEqual([event.aggregateId]);
    });

    it('should leave no unhandled rejection when the publisher does not wait', async () => {
      const unhandled: unknown[] = [];
      const onUnhandledRejection = (reason: unknown): void => {
        unhandled.push(reason);
      };
      process.on('unhandledRejection', onUnhandledRejection);
      eventBus.subscribe(
        aHandlerOf([TextResourceCreatedDomainEvent], () =>
          Promise.reject(new Error('the handler broke'))
        )
      );

      void publishInASession(SessionMother.random(), [anEventOfACreatedResource()]);
      await aTick();
      await aTick();
      process.off('unhandledRejection', onUnhandledRejection);

      expect(unhandled).toStrictEqual([]);
    });

    it('should take an event that nobody subscribes to', async () => {
      await expect(
        publishInASession(SessionMother.random(), [anEventOfACreatedResource()])
      ).resolves.toBeUndefined();
    });

    it('should open the Session of the publisher around the handler, also after the publisher returns', async () => {
      const session = SessionMother.random();
      let reached: (current: Session) => void = () => undefined;
      const current = new Promise<Session>(resolve => {
        reached = resolve;
      });
      eventBus.subscribe(
        aHandlerOf([TextResourceCreatedDomainEvent], async () => {
          await aTick();
          reached(sessionRunner.current());
        })
      );

      sessionRunner.run(session, () => {
        void eventBus.publish([anEventOfACreatedResource()]);
      });

      await expect(current).resolves.toStrictEqual(session);
    });

    it('should keep two Sessions when two of them publish at the same time', async () => {
      const first = SessionMother.random('mcp');
      const second = SessionMother.random('interface');
      const currents = new Map<string, Session>();
      eventBus.subscribe(
        aHandlerOf([TextResourceCreatedDomainEvent], async event => {
          await aTick();
          currents.set(event.aggregateId, sessionRunner.current());
        })
      );
      const ofFirst = anEventOfACreatedResource();
      const ofSecond = anEventOfACreatedResource();

      await Promise.all([
        publishInASession(first, [ofFirst]),
        publishInASession(second, [ofSecond])
      ]);

      expect(currents.get(ofFirst.aggregateId)).toStrictEqual(first);
      expect(currents.get(ofSecond.aggregateId)).toStrictEqual(second);
    });

    it('should open the Session of the envelope with the SessionRunner around the handler', async () => {
      const session = SessionMother.random('interface');
      const opened: Session[] = [];
      let isOpen = false;
      const aRunnerWithNoAsyncContext: SessionRunner = {
        run: <T>(opening: Session, work: () => T): T => {
          opened.push(opening);
          isOpen = true;
          const done = work();
          isOpen = false;
          return done;
        },
        current: () => session
      };
      const bus = new EmitteryEventBus({sessionRunner: aRunnerWithNoAsyncContext});
      let wasOpenAtTheHandler = false;
      bus.subscribe(
        aHandlerOf([TextResourceCreatedDomainEvent], async () => {
          wasOpenAtTheHandler = isOpen;
        })
      );

      await bus.publish([anEventOfACreatedResource()]);

      expect(opened).toStrictEqual([session]);
      expect(wasOpenAtTheHandler).toBe(true);
    });

    it('should carry the Session on to the handlers of the events that a handler publishes', async () => {
      const session = SessionMother.random('interface');
      let reached: (current: Session) => void = () => undefined;
      const current = new Promise<Session>(resolve => {
        reached = resolve;
      });
      eventBus.subscribe(
        aHandlerOf([TextResourceCreatedDomainEvent], async () => {
          await aTick();
          void eventBus.publish([anEventOfARetriedResource()]);
        })
      );
      eventBus.subscribe(
        aHandlerOf([TextResourceRetriedDomainEvent], async () => {
          await aTick();
          reached(sessionRunner.current());
        })
      );

      sessionRunner.run(session, () => {
        void eventBus.publish([anEventOfACreatedResource()]);
      });

      await expect(current).resolves.toStrictEqual(session);
    });

    it('should run the handler with no Session, and log it, when no Session is open around the publisher', async () => {
      const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      let sawNoSession = false;
      eventBus.subscribe(
        aHandlerOf([TextResourceCreatedDomainEvent], async () => {
          sawNoSession = !hasASession();
        })
      );
      const event = anEventOfACreatedResource();

      await expect(eventBus.publish([event])).resolves.toBeUndefined();

      expect(sawNoSession).toBe(true);
      expect(consoleWarn).toHaveBeenCalledWith(
        `A handler of ${event.eventName} runs with no Session`
      );
      consoleWarn.mockRestore();
    });

    it('should log nothing when a Session is open around the publisher', async () => {
      const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      eventBus.subscribe(
        aHandlerOf([TextResourceCreatedDomainEvent], async () => undefined)
      );

      await publishInASession(SessionMother.random(), [anEventOfACreatedResource()]);

      expect(consoleWarn).not.toHaveBeenCalled();
      consoleWarn.mockRestore();
    });
  });
});
