import {
  LangfuseOtelSpanAttributes,
  propagateAttributes,
  startActiveObservation
} from '@langfuse/tracing';
import {hrTimeToMilliseconds} from '@opentelemetry/core';
import type {ReadableSpan} from '@opentelemetry/sdk-trace-base';
import type {SessionRunner} from '../../../../../../src/core/shared/domain/services/SessionRunner';
import type {Session} from '../../../../../../src/core/shared/domain/value-objects/Session';
import {AsyncLocalStorageSessionRunner} from '../../../../../../src/core/shared/infrastructure/async-hooks/AsyncLocalStorageSessionRunner';
import {LangfuseModelCallRecorder} from '../../../../../../src/core/shared/infrastructure/langfuse/LangfuseModelCallRecorder';
import {LangfuseOperationRunner} from '../../../../../../src/core/shared/infrastructure/langfuse/LangfuseOperationRunner';
import {useLangfuseSpans} from '../../../../../lib/langfuseSpans';
import {ModelCallMother} from '../../../../../utils/object-mother/ModelCallMother';
import {SessionMother} from '../../../../../utils/object-mother/SessionMother';

const aTick = (): Promise<void> => new Promise(resolve => setImmediate(resolve));

const rootsOf = (spans: ReadableSpan[]): ReadableSpan[] =>
  spans.filter(span => span.parentSpanContext === undefined);

const traceIdOf = (span: ReadableSpan): string => span.spanContext().traceId;

describe('LangfuseOperationRunner', () => {
  const langfuse = useLangfuseSpans();
  const recorder = new LangfuseModelCallRecorder({models: []});
  let sessionRunner: AsyncLocalStorageSessionRunner;
  let operationRunner: LangfuseOperationRunner;

  beforeEach(() => {
    sessionRunner = new AsyncLocalStorageSessionRunner();
    operationRunner = new LangfuseOperationRunner({sessionRunner});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const recordAQueryAfterATick = async (): Promise<void> => {
    await aTick();
    recorder.record(ModelCallMother.embedQuery());
  };

  describe('#run', () => {
    it('should give what the work gives', async () => {
      const result = await sessionRunner.run(SessionMother.random(), () =>
        operationRunner.run('GET /search', async () => 'the result')
      );

      expect(result).toBe('the result');
    });

    it('should send nothing when the work records no Model call', async () => {
      await sessionRunner.run(SessionMother.random(), () =>
        operationRunner.run('GET /resources', async () => undefined)
      );

      const spans = await langfuse.spans();

      expect(spans).toStrictEqual([]);
    });

    it('should make one trace with the name of the operation, which holds each Model call of the work', async () => {
      await sessionRunner.run(SessionMother.random(), () =>
        operationRunner.run('GET /search', async () => {
          await recordAQueryAfterATick();
          await recordAQueryAfterATick();
        })
      );

      const spans = await langfuse.spans();

      const [root] = rootsOf(spans);
      const calls = spans.filter(span => span !== root);
      expect(rootsOf(spans)).toHaveLength(1);
      expect(root.name).toBe('GET /search');
      expect(calls.map(call => call.name)).toStrictEqual(['embed-query', 'embed-query']);
      expect(calls.map(call => call.parentSpanContext?.spanId)).toStrictEqual([
        root.spanContext().spanId,
        root.spanContext().spanId
      ]);
      expect(calls.map(traceIdOf)).toStrictEqual([traceIdOf(root), traceIdOf(root)]);
    });

    it('should start the trace when run() starts, and end it when the work ends', async () => {
      const startOfRun = Date.now();
      let endOfWork = 0;

      await sessionRunner.run(SessionMother.random(), () =>
        operationRunner.run('GET /search', async () => {
          await new Promise(resolve => setTimeout(resolve, 20));
          recorder.record(ModelCallMother.embedQuery());
          await new Promise(resolve => setTimeout(resolve, 20));
          endOfWork = Date.now();
        })
      );

      const spans = await langfuse.spans();

      const [root] = rootsOf(spans);
      expect(hrTimeToMilliseconds(root.startTime)).toBeLessThan(startOfRun + 10);
      expect(hrTimeToMilliseconds(root.endTime)).toBeGreaterThanOrEqual(endOfWork - 1);
    });

    it.each([
      ['mcp', 'mcp'],
      ['interface', 'interface']
    ] as const)(
      'should put the sessionId and the tag %s on the trace and on its Model calls',
      async (origin, tag) => {
        const session = SessionMother.random(origin);

        await sessionRunner.run(session, () =>
          operationRunner.run('GET /search', recordAQueryAfterATick)
        );

        const spans = await langfuse.spans();

        expect(spans).toHaveLength(2);
        for (const span of spans) {
          expect(span.attributes[LangfuseOtelSpanAttributes.TRACE_SESSION_ID]).toBe(
            session.id.value
          );
          expect(span.attributes[LangfuseOtelSpanAttributes.TRACE_TAGS]).toStrictEqual([
            tag
          ]);
        }
      }
    );

    it('should give each operation its own trace and Session when two run at the same time', async () => {
      const first = SessionMother.random('mcp');
      const second = SessionMother.random('interface');

      await Promise.all([
        sessionRunner.run(first, () =>
          operationRunner.run('GET /search', recordAQueryAfterATick)
        ),
        sessionRunner.run(second, () =>
          operationRunner.run('GET /resources/texts/:id/matches', recordAQueryAfterATick)
        )
      ]);

      const spans = await langfuse.spans();

      const roots = rootsOf(spans);
      const sessionOfTheTrace = (name: string): unknown =>
        roots.find(root => root.name === name)?.attributes[
          LangfuseOtelSpanAttributes.TRACE_SESSION_ID
        ];
      expect(roots).toHaveLength(2);
      expect(sessionOfTheTrace('GET /search')).toBe(first.id.value);
      expect(sessionOfTheTrace('GET /resources/texts/:id/matches')).toBe(second.id.value);
      for (const call of spans.filter(span => !roots.includes(span))) {
        const root = roots.find(candidate => traceIdOf(candidate) === traceIdOf(call));
        expect(call.attributes[LangfuseOtelSpanAttributes.TRACE_SESSION_ID]).toBe(
          root?.attributes[LangfuseOtelSpanAttributes.TRACE_SESSION_ID]
        );
      }
    });

    it('should start a root trace with its own Session, also inside the active span and the Session of another trace', async () => {
      const ofTheRequest = SessionMother.random('mcp');
      const ofTheHandler = SessionMother.random('interface');

      await propagateAttributes(
        {sessionId: ofTheRequest.id.value, tags: [ofTheRequest.origin.value]},
        () =>
          startActiveObservation('POST /resources/texts', () =>
            sessionRunner.run(ofTheHandler, () =>
              operationRunner.run(
                'IngestTextResourceOnTextResourceCreatedOrRetried',
                recordAQueryAfterATick
              )
            )
          )
      );

      const spans = await langfuse.spans();

      const ofTheOperation = spans.filter(span => span.name !== 'POST /resources/texts');
      expect(
        rootsOf(spans)
          .map(root => root.name)
          .toSorted()
      ).toStrictEqual([
        'IngestTextResourceOnTextResourceCreatedOrRetried',
        'POST /resources/texts'
      ]);
      expect(ofTheOperation).toHaveLength(2);
      for (const span of ofTheOperation) {
        expect(span.attributes[LangfuseOtelSpanAttributes.TRACE_SESSION_ID]).toBe(
          ofTheHandler.id.value
        );
        expect(span.attributes[LangfuseOtelSpanAttributes.TRACE_TAGS]).toStrictEqual([
          'interface'
        ]);
      }
    });

    it('should send a Model call recorded after the work ends with no parent, when the work recorded none', async () => {
      let late: Promise<void> = Promise.resolve();

      await sessionRunner.run(SessionMother.random(), () =>
        operationRunner.run('POST /resources/texts', async () => {
          late = recordAQueryAfterATick();
        })
      );
      await late;

      const spans = await langfuse.spans();

      expect(spans.map(span => span.name)).toStrictEqual(['embed-query']);
      expect(spans[0].parentSpanContext).toBeUndefined();
    });

    it('should keep a Model call recorded after the work ends in the trace, when the work recorded one', async () => {
      let late: Promise<void> = Promise.resolve();

      await sessionRunner.run(SessionMother.random(), () =>
        operationRunner.run('POST /resources/texts', async () => {
          await recordAQueryAfterATick();
          late = recordAQueryAfterATick();
        })
      );
      await late;

      const spans = await langfuse.spans();

      const [root] = rootsOf(spans);
      expect(rootsOf(spans)).toHaveLength(1);
      expect(spans.map(traceIdOf)).toStrictEqual(spans.map(() => traceIdOf(root)));
    });

    it('should reject with the error of the work, and end the trace', async () => {
      const failure = new Error('the work broke');

      await expect(
        sessionRunner.run(SessionMother.random(), () =>
          operationRunner.run('GET /search', async () => {
            await recordAQueryAfterATick();
            throw failure;
          })
        )
      ).rejects.toBe(failure);

      const spans = await langfuse.spans();

      expect(rootsOf(spans).map(root => root.name)).toStrictEqual(['GET /search']);
    });

    it('should run the work in a trace with no sessionId and no tag, and log it, when no Session is open', async () => {
      const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const result = await operationRunner.run('GET /search', async () => {
        await recordAQueryAfterATick();

        return 'the result';
      });

      const spans = await langfuse.spans();

      expect(result).toBe('the result');
      expect(rootsOf(spans).map(root => root.name)).toStrictEqual(['GET /search']);
      for (const span of spans) {
        expect(span.attributes).not.toHaveProperty(
          LangfuseOtelSpanAttributes.TRACE_SESSION_ID
        );
        expect(span.attributes).not.toHaveProperty(LangfuseOtelSpanAttributes.TRACE_TAGS);
      }
      expect(consoleWarn).toHaveBeenCalledWith('The trace of GET /search has no Session');
    });

    it('should run the work with no trace, and log it, when the trace cannot open', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      const failure = new Error('the Session broke');
      const aBrokenSessionRunner: SessionRunner = {
        run: <T>(_session: Session, work: () => T): T => work(),
        current: () => {
          throw failure;
        }
      };
      const runner = new LangfuseOperationRunner({sessionRunner: aBrokenSessionRunner});

      const result = await runner.run('GET /search', async () => {
        await recordAQueryAfterATick();

        return 'the result';
      });

      const spans = await langfuse.spans();

      expect(result).toBe('the result');
      expect(spans.map(span => span.name)).toStrictEqual(['embed-query']);
      expect(consoleError).toHaveBeenCalledWith(
        'The trace of GET /search cannot open',
        failure
      );
    });
  });
});
