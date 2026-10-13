import {LangfuseOtelSpanAttributes} from '@langfuse/tracing';
import {hrTimeToMilliseconds} from '@opentelemetry/core';
import type {ReadableSpan} from '@opentelemetry/sdk-trace-base';
import type {ModelCall} from '../../../../../../src/core/shared/domain/services/ModelCallRecorder';
import {LangfuseModelCallRecorder} from '../../../../../../src/core/shared/infrastructure/langfuse/LangfuseModelCallRecorder';
import {useLangfuseSpans} from '../../../../../lib/langfuseSpans';
import {ModelCallMother} from '../../../../../utils/object-mother/ModelCallMother';

const DTYPE = `${LangfuseOtelSpanAttributes.OBSERVATION_METADATA}.dtype`;

const parse = (attribute: unknown): unknown => JSON.parse(String(attribute));

describe('LangfuseModelCallRecorder', () => {
  const langfuse = useLangfuseSpans();
  const recorder = new LangfuseModelCallRecorder();

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const theOnlySpan = async (): Promise<ReadableSpan> => {
    const spans = await langfuse.spans();

    expect(spans).toHaveLength(1);

    return spans[0];
  };

  describe('#record', () => {
    it('should make one embedding with the name, the model, the dtype, the Usage and the input of the Model call', async () => {
      recorder.record(
        ModelCallMother.embedQuery({
          model: {repository: 'Xenova/multilingual-e5-small', dtype: 'q8'},
          usage: {input: 12},
          input: 'the notes of the meeting'
        })
      );

      const span = await theOnlySpan();
      expect(span.name).toBe('embed-query');
      expect(span.attributes[LangfuseOtelSpanAttributes.OBSERVATION_TYPE]).toBe(
        'embedding'
      );
      expect(span.attributes[LangfuseOtelSpanAttributes.OBSERVATION_MODEL]).toBe(
        'Xenova/multilingual-e5-small'
      );
      expect(span.attributes[DTYPE]).toBe('q8');
      expect(
        parse(span.attributes[LangfuseOtelSpanAttributes.OBSERVATION_USAGE_DETAILS])
      ).toStrictEqual({
        input: 12
      });
      expect(span.attributes[LangfuseOtelSpanAttributes.OBSERVATION_INPUT]).toBe(
        'the notes of the meeting'
      );
      expect(span.attributes).not.toHaveProperty(
        LangfuseOtelSpanAttributes.OBSERVATION_OUTPUT
      );
      expect(span.attributes).not.toHaveProperty(
        LangfuseOtelSpanAttributes.OBSERVATION_LEVEL
      );
    });

    it('should give the scores of a rerank as its output, and each key of its Usage', async () => {
      recorder.record(
        ModelCallMother.embedQuery({
          name: 'rerank',
          usage: {input: 900, pairs: 3},
          input: {query: 'the beach', texts: ['one', 'two', 'three']},
          output: [0.9, 0.5, 0.1]
        })
      );

      const span = await theOnlySpan();
      expect(
        parse(span.attributes[LangfuseOtelSpanAttributes.OBSERVATION_USAGE_DETAILS])
      ).toStrictEqual({
        input: 900,
        pairs: 3
      });
      expect(
        parse(span.attributes[LangfuseOtelSpanAttributes.OBSERVATION_INPUT])
      ).toStrictEqual({
        query: 'the beach',
        texts: ['one', 'two', 'three']
      });
      expect(
        parse(span.attributes[LangfuseOtelSpanAttributes.OBSERVATION_OUTPUT])
      ).toStrictEqual([0.9, 0.5, 0.1]);
    });

    it('should give the start and the end of the Model call', async () => {
      const startTime = new Date('2026-10-13T10:00:00.000Z');
      const endTime = new Date('2026-10-13T10:00:00.250Z');

      recorder.record(ModelCallMother.embedQuery({startTime, endTime}));

      const span = await theOnlySpan();
      expect(hrTimeToMilliseconds(span.startTime)).toBe(startTime.getTime());
      expect(hrTimeToMilliseconds(span.endTime)).toBe(endTime.getTime());
    });

    it('should give the error level and the message when the Model call threw', async () => {
      recorder.record(
        ModelCallMother.embedQuery({
          usage: {input: 5},
          error: new Error('the model broke')
        })
      );

      const span = await theOnlySpan();
      expect(span.attributes[LangfuseOtelSpanAttributes.OBSERVATION_LEVEL]).toBe('ERROR');
      expect(span.attributes[LangfuseOtelSpanAttributes.OBSERVATION_STATUS_MESSAGE]).toBe(
        'the model broke'
      );
      expect(
        parse(span.attributes[LangfuseOtelSpanAttributes.OBSERVATION_USAGE_DETAILS])
      ).toStrictEqual({input: 5});
    });

    it('should give the error as text when the Model call threw something that is not an Error', async () => {
      recorder.record(ModelCallMother.embedQuery({error: 'the model broke'}));

      const span = await theOnlySpan();
      expect(span.attributes[LangfuseOtelSpanAttributes.OBSERVATION_LEVEL]).toBe('ERROR');
      expect(span.attributes[LangfuseOtelSpanAttributes.OBSERVATION_STATUS_MESSAGE]).toBe(
        'the model broke'
      );
    });

    it('should send the size of a Picture, not its pixels', async () => {
      recorder.record(
        ModelCallMother.embedQuery({
          name: 'embed-picture',
          usage: {image: 1},
          input: {data: new Uint8Array(2 * 3 * 4), width: 2, height: 3, channels: 4}
        })
      );

      expect(
        parse(
          (await theOnlySpan()).attributes[LangfuseOtelSpanAttributes.OBSERVATION_INPUT]
        )
      ).toStrictEqual({
        width: 2,
        height: 3,
        channels: 4
      });
    });

    it('should not throw, and log the error, when the Model call cannot be recorded', () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      const failure = new Error('the Usage broke');
      const aBrokenCall = {
        ...ModelCallMother.embedQuery(),
        get usage(): ModelCall['usage'] {
          throw failure;
        }
      };

      expect(() => recorder.record(aBrokenCall)).not.toThrow();
      expect(consoleError).toHaveBeenCalledWith(
        'A Model call cannot be recorded',
        failure
      );
    });
  });
});
