import {LangfuseOtelSpanAttributes} from '@langfuse/tracing';
import {hrTimeToMilliseconds} from '@opentelemetry/core';
import type {ReadableSpan} from '@opentelemetry/sdk-trace-base';
import sharp from 'sharp';
import {RERANKER_MODEL} from '../../../../../../src/core/search/infrastructure/transformers/RerankerModel';
import type {Pixels} from '../../../../../../src/core/shared/domain/services/ImageEmbedder';
import type {ModelCall} from '../../../../../../src/core/shared/domain/services/ModelCallTracker';
import {LangfuseModelCallTracker} from '../../../../../../src/core/shared/infrastructure/langfuse/LangfuseModelCallTracker';
import {TEXT_MODEL} from '../../../../../../src/core/shared/infrastructure/transformers/TextModel';
import {VISION_MODEL} from '../../../../../../src/core/shared/infrastructure/transformers/VisionModel';
import {useLangfuseSpans} from '../../../../../lib/langfuseSpans';
import {ModelCallMother} from '../../../../../utils/object-mother/ModelCallMother';

const DTYPE = `${LangfuseOtelSpanAttributes.OBSERVATION_METADATA}.dtype`;

const parse = (attribute: unknown): unknown => JSON.parse(String(attribute));

const aPicture = (width: number, height: number): Pixels => ({
  data: new Uint8Array(width * height * 3).fill(128),
  width,
  height,
  channels: 3
});

const bytesOf = (dataUri: string): Buffer => {
  const [prefix, base64] = dataUri.split(',');

  expect(prefix).toBe('data:image/webp;base64');

  return Buffer.from(base64, 'base64');
};

describe('LangfuseModelCallTracker', () => {
  const langfuse = useLangfuseSpans();
  const tracker = new LangfuseModelCallTracker({
    models: [TEXT_MODEL, VISION_MODEL, RERANKER_MODEL]
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const theOnlySpan = async (): Promise<ReadableSpan> => {
    const spans = await langfuse.spans();

    expect(spans).toHaveLength(1);

    return spans[0];
  };

  // The WebP of a Picture is made after track() returns, and its observation ends then.
  const theOnlySpanOnceItEnds = (): Promise<ReadableSpan> => vi.waitFor(theOnlySpan);

  describe('#track', () => {
    it('should make one embedding with the name, the model, the dtype, the Usage and the input of the Model call', async () => {
      tracker.track(
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
      tracker.track(
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

    // The prices of the table of ADR-0049, so a constant that moves from it fails here.
    it.each([
      ['Text model', 'embed-chunk', TEXT_MODEL, {input: 512}, {input: 512 * 0.00000002}],
      [
        'Vision model',
        'embed-query',
        VISION_MODEL,
        {input: 128},
        {input: 128 * 0.00000012}
      ],
      ['Vision model', 'embed-picture', VISION_MODEL, {image: 1}, {image: 0.0000301}],
      [
        'Reranker',
        'rerank',
        RERANKER_MODEL,
        {input: 900, pairs: 3},
        {input: 900 * 0.00000002}
      ]
    ] as const)(
      'should give the Cost of a Model call of the %s as its Usage times its price (%s)',
      async (_, name, {repository, dtype}, usage, cost) => {
        tracker.track(
          ModelCallMother.embedQuery({name, model: {repository, dtype}, usage})
        );

        const span = await theOnlySpan();
        expect(
          parse(span.attributes[LangfuseOtelSpanAttributes.OBSERVATION_COST_DETAILS])
        ).toStrictEqual(cost);
      }
    );

    it.each([
      ['the Usage has no key with a price', RERANKER_MODEL.repository, {pairs: 3}],
      ['the model has no price', 'Xenova/multilingual-e5-small', {input: 7}]
    ])('should give no Cost when %s', async (_, repository, usage) => {
      tracker.track(
        ModelCallMother.embedQuery({model: {repository, dtype: 'fp32'}, usage})
      );

      const span = await theOnlySpan();
      expect(span.attributes).not.toHaveProperty(
        LangfuseOtelSpanAttributes.OBSERVATION_COST_DETAILS
      );
    });

    it('should give the start and the end of the Model call', async () => {
      const startTime = new Date('2026-10-13T10:00:00.000Z');
      const endTime = new Date('2026-10-13T10:00:00.250Z');

      tracker.track(ModelCallMother.embedQuery({startTime, endTime}));

      const span = await theOnlySpan();
      expect(hrTimeToMilliseconds(span.startTime)).toBe(startTime.getTime());
      expect(hrTimeToMilliseconds(span.endTime)).toBe(endTime.getTime());
    });

    it('should give the error level and the message when the Model call threw', async () => {
      tracker.track(
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
      tracker.track(ModelCallMother.embedQuery({error: 'the model broke'}));

      const span = await theOnlySpan();
      expect(span.attributes[LangfuseOtelSpanAttributes.OBSERVATION_LEVEL]).toBe('ERROR');
      expect(span.attributes[LangfuseOtelSpanAttributes.OBSERVATION_STATUS_MESSAGE]).toBe(
        'the model broke'
      );
    });

    it.each([
      [640, 480, 320, 240],
      [30, 60, 160, 320]
    ])(
      'should send a Picture of %ix%i as a WebP of %ix%i, with its Usage',
      async (width, height, webpWidth, webpHeight) => {
        tracker.track(ModelCallMother.embedPicture({input: aPicture(width, height)}));

        const span = await theOnlySpanOnceItEnds();
        const webp = await sharp(
          bytesOf(String(span.attributes[LangfuseOtelSpanAttributes.OBSERVATION_INPUT]))
        ).metadata();
        expect([webp.format, webp.width, webp.height]).toStrictEqual([
          'webp',
          webpWidth,
          webpHeight
        ]);
        expect(
          parse(span.attributes[LangfuseOtelSpanAttributes.OBSERVATION_USAGE_DETAILS])
        ).toStrictEqual({image: 1});
      }
    );

    it.each([1, 4] as const)(
      'should send a Picture of %i channels as a WebP of 320 px on the long edge',
      async channels => {
        tracker.track(
          ModelCallMother.embedPicture({
            input: {
              data: new Uint8Array(64 * 32 * channels),
              width: 64,
              height: 32,
              channels
            }
          })
        );

        const span = await theOnlySpanOnceItEnds();
        const webp = await sharp(
          bytesOf(String(span.attributes[LangfuseOtelSpanAttributes.OBSERVATION_INPUT]))
        ).metadata();
        expect([webp.format, webp.width, webp.height]).toStrictEqual(['webp', 320, 160]);
      }
    );

    it('should send the Model call with no input, and log the error, when the Picture cannot become a WebP', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      const endTime = new Date('2026-10-13T10:00:00.250Z');

      tracker.track(
        ModelCallMother.embedPicture({
          input: {data: new Uint8Array(1), width: 640, height: 480, channels: 3},
          endTime
        })
      );

      const span = await theOnlySpanOnceItEnds();
      expect(span.attributes).not.toHaveProperty(
        LangfuseOtelSpanAttributes.OBSERVATION_INPUT
      );
      expect(hrTimeToMilliseconds(span.endTime)).toBe(endTime.getTime());
      expect(consoleError).toHaveBeenCalledWith(
        'The Picture of a Model call cannot become a WebP',
        expect.any(Error)
      );
    });

    it('should not throw, and log the error, when the Model call cannot be tracked', () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      const failure = new Error('the Usage broke');
      const aBrokenCall = {
        ...ModelCallMother.embedQuery(),
        get usage(): ModelCall['usage'] {
          throw failure;
        }
      };

      expect(() => tracker.track(aBrokenCall)).not.toThrow();
      expect(consoleError).toHaveBeenCalledWith(
        'A Model call cannot be tracked',
        failure
      );
    });
  });
});
