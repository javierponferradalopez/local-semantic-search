import {LangfuseOtelSpanAttributes} from '@langfuse/tracing';
import type {ReadableSpan} from '@opentelemetry/sdk-trace-base';
import {TextResourceCreatedDomainEvent} from '../../../../../../src/core/resources/domain/events/TextResourceCreatedDomainEvent';
import {TextResourceDeletedDomainEvent} from '../../../../../../src/core/resources/domain/events/TextResourceDeletedDomainEvent';
import {TextResourceRetriedDomainEvent} from '../../../../../../src/core/resources/domain/events/TextResourceRetriedDomainEvent';
import type {DomainEvent} from '../../../../../../src/core/shared/domain/DomainEvent';
import type {
  DomainEventClass,
  DomainEventHandler
} from '../../../../../../src/core/shared/domain/DomainEventHandler';
import {NoSessionError} from '../../../../../../src/core/shared/domain/errors/NoSessionError';
import type {OperationRunner} from '../../../../../../src/core/shared/domain/services/OperationRunner';
import type {SessionRunner} from '../../../../../../src/core/shared/domain/services/SessionRunner';
import type {Session} from '../../../../../../src/core/shared/domain/value-objects/Session';
import {AsyncLocalStorageSessionRunner} from '../../../../../../src/core/shared/infrastructure/async-hooks/AsyncLocalStorageSessionRunner';
import {EmitteryEventBus} from '../../../../../../src/core/shared/infrastructure/emittery/EmitteryEventBus';
import {LangfuseModelCallRecorder} from '../../../../../../src/core/shared/infrastructure/langfuse/LangfuseModelCallRecorder';
import {LangfuseOperationRunner} from '../../../../../../src/core/shared/infrastructure/langfuse/LangfuseOperationRunner';
import {SilentOperationRunner} from '../../../../../../src/core/shared/infrastructure/SilentOperationRunner';
import {useLangfuseSpans} from '../../../../../lib/langfuseSpans';
import {ModelCallMother} from '../../../../../utils/object-mother/ModelCallMother';
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

class IngestTheNotes implements DomainEventHandler {
  private readonly _handle: (event: DomainEvent) => Promise<void>;

  public constructor({handle}: {handle: (event: DomainEvent) => Promise<void>}) {
    this._handle = handle;
  }

  public subscribeTo(): DomainEventClass<DomainEvent>[] {
    return [TextResourceCreatedDomainEvent, TextResourceRetriedDomainEvent];
  }

  public handle(event: DomainEvent): Promise<void> {
    return this._handle(event);
  }
}

const aTick = (): Promise<void> => new Promise(resolve => setImmediate(resolve));

const rootsOf = (spans: ReadableSpan[]): ReadableSpan[] =>
  spans.filter(span => span.parentSpanContext === undefined);

describe('EmitteryEventBus', () => {
  const langfuse = useLangfuseSpans();
  const recorder = new LangfuseModelCallRecorder();
  let sessionRunner: AsyncLocalStorageSessionRunner;
  let eventBus: EmitteryEventBus;

  beforeEach(() => {
    sessionRunner = new AsyncLocalStorageSessionRunner();
    eventBus = new EmitteryEventBus({
      sessionRunner,
      operationRunner: new SilentOperationRunner()
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const aBusOnLangfuse = (): EmitteryEventBus =>
    new EmitteryEventBus({
      sessionRunner,
      operationRunner: new LangfuseOperationRunner({sessionRunner})
    });

  const recordAChunkAfterATick = async (): Promise<void> => {
    await aTick();
    recorder.record(ModelCallMother.embedQuery({name: 'embed-chunk'}));
  };

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
      const bus = new EmitteryEventBus({
        sessionRunner: aRunnerWithNoAsyncContext,
        operationRunner: new SilentOperationRunner()
      });
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
    });

    it('should log nothing when a Session is open around the publisher', async () => {
      const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      eventBus.subscribe(
        aHandlerOf([TextResourceCreatedDomainEvent], async () => undefined)
      );

      await publishInASession(SessionMother.random(), [anEventOfACreatedResource()]);

      expect(consoleWarn).not.toHaveBeenCalled();
    });

    it('should run the handler inside an operation named after its class, inside the Session of the envelope', async () => {
      const session = SessionMother.random('interface');
      const operations: {name: string; session: Session}[] = [];
      const aRecordingOperationRunner: OperationRunner = {
        run: <T>(name: string, work: () => Promise<T>): Promise<T> => {
          operations.push({name, session: sessionRunner.current()});

          return work();
        }
      };
      const bus = new EmitteryEventBus({
        sessionRunner,
        operationRunner: aRecordingOperationRunner
      });
      let reachedTheHandler = false;
      bus.subscribe(
        new IngestTheNotes({
          handle: async () => {
            reachedTheHandler = true;
          }
        })
      );

      await sessionRunner.run(session, () => bus.publish([anEventOfACreatedResource()]));

      expect(operations).toStrictEqual([{name: 'IngestTheNotes', session}]);
      expect(reachedTheHandler).toBe(true);
    });

    it('should send one root trace named after the handler, with the sessionId and the tag, for a handler with a Model call', async () => {
      const session = SessionMother.random('interface');
      const bus = aBusOnLangfuse();
      bus.subscribe(new IngestTheNotes({handle: recordAChunkAfterATick}));

      await sessionRunner.run(session, () => bus.publish([anEventOfACreatedResource()]));

      const spans = await langfuse.spans();
      const roots = rootsOf(spans);
      expect(roots.map(root => root.name)).toStrictEqual(['IngestTheNotes']);
      expect(spans.map(span => span.name).toSorted()).toStrictEqual([
        'IngestTheNotes',
        'embed-chunk'
      ]);
      for (const span of spans) {
        expect(span.attributes[LangfuseOtelSpanAttributes.TRACE_SESSION_ID]).toBe(
          session.id.value
        );
        expect(span.attributes[LangfuseOtelSpanAttributes.TRACE_TAGS]).toStrictEqual([
          'interface'
        ]);
      }
    });

    it('should send nothing for a handler with no Model call', async () => {
      const bus = aBusOnLangfuse();
      bus.subscribe(new IngestTheNotes({handle: async () => undefined}));

      await sessionRunner.run(SessionMother.random(), () =>
        bus.publish([anEventOfACreatedResource()])
      );

      expect(await langfuse.spans()).toStrictEqual([]);
    });

    it('should give the handler a trace of its own, apart from the trace of the request that published', async () => {
      const operationRunner = new LangfuseOperationRunner({sessionRunner});
      const bus = aBusOnLangfuse();
      let ingest: Promise<void> = Promise.resolve();
      bus.subscribe(new IngestTheNotes({handle: recordAChunkAfterATick}));

      await sessionRunner.run(SessionMother.random(), () =>
        operationRunner.run('POST /resources/texts', async () => {
          recorder.record(ModelCallMother.embedQuery());
          ingest = bus.publish([anEventOfACreatedResource()]);
        })
      );
      await ingest;

      const spans = await langfuse.spans();
      const roots = rootsOf(spans);
      const traceOf = (name: string): string | undefined =>
        spans.find(span => span.name === name)?.spanContext().traceId;
      expect(roots.map(root => root.name).toSorted()).toStrictEqual([
        'IngestTheNotes',
        'POST /resources/texts'
      ]);
      expect(traceOf('embed-chunk')).toBe(traceOf('IngestTheNotes'));
      expect(traceOf('embed-chunk')).not.toBe(traceOf('POST /resources/texts'));
    });

    it('should record the Model calls of a failed handler with the error level, and give a Retry a new trace in the Session that retried', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      const uploaded = SessionMother.random('interface');
      const retried = SessionMother.random('mcp');
      const bus = aBusOnLangfuse();
      bus.subscribe(
        new IngestTheNotes({
          handle: async (event: DomainEvent): Promise<void> => {
            await aTick();
            if (event instanceof TextResourceCreatedDomainEvent) {
              recorder.record(
                ModelCallMother.embedQuery({
                  name: 'embed-chunk',
                  error: new Error('the model broke')
                })
              );
              throw new Error('the Ingest broke');
            }
            recorder.record(ModelCallMother.embedQuery({name: 'embed-chunk'}));
          }
        })
      );

      await expect(
        sessionRunner.run(uploaded, () => bus.publish([anEventOfACreatedResource()]))
      ).rejects.toThrow();
      await sessionRunner.run(retried, () => bus.publish([anEventOfARetriedResource()]));

      const spans = await langfuse.spans();
      const calls = spans.filter(span => span.name === 'embed-chunk');
      const sessionOf = (span: ReadableSpan): unknown =>
        span.attributes[LangfuseOtelSpanAttributes.TRACE_SESSION_ID];
      const levelOf = (span: ReadableSpan): unknown =>
        span.attributes[LangfuseOtelSpanAttributes.OBSERVATION_LEVEL];
      expect(rootsOf(spans).map(sessionOf).toSorted()).toStrictEqual(
        [uploaded.id.value, retried.id.value].toSorted()
      );
      expect(calls.map(call => [sessionOf(call), levelOf(call)])).toStrictEqual([
        [uploaded.id.value, 'ERROR'],
        [retried.id.value, undefined]
      ]);
    });

    it('should run the handler inside its operation with no Session, and log it, when the envelope has no Session', async () => {
      const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const bus = aBusOnLangfuse();
      bus.subscribe(new IngestTheNotes({handle: recordAChunkAfterATick}));
      const event = anEventOfACreatedResource();

      await expect(bus.publish([event])).resolves.toBeUndefined();

      const spans = await langfuse.spans();
      expect(rootsOf(spans).map(root => root.name)).toStrictEqual(['IngestTheNotes']);
      for (const span of spans) {
        expect(span.attributes).not.toHaveProperty(
          LangfuseOtelSpanAttributes.TRACE_SESSION_ID
        );
      }
      expect(consoleWarn).toHaveBeenCalledWith(
        `A handler of ${event.eventName} runs with no Session`
      );
      expect(consoleWarn).toHaveBeenCalledWith(
        'The trace of IngestTheNotes has no Session'
      );
    });
  });
});
