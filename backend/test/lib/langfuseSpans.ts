import {getLangfuseTracerProvider} from '@langfuse/tracing';
import {InMemorySpanExporter, type ReadableSpan} from '@opentelemetry/sdk-trace-base';
import type {NodeTracerProvider} from '@opentelemetry/sdk-trace-node';
import {LangfuseTracing} from '../../src/core/shared/infrastructure/langfuse/LangfuseTracing';

// Starts the Langfuse tracing for the suite that calls it, on an exporter in memory and with no media upload: no test calls Langfuse Cloud.
export const useLangfuseSpans = (): {spans: () => Promise<ReadableSpan[]>} => {
  const exporter = new InMemorySpanExporter();

  beforeAll(() => {
    LangfuseTracing.start({exporter, exportMode: 'immediate', mediaUploadEnabled: false});
  });

  afterEach(() => {
    exporter.reset();
  });

  afterAll(() => LangfuseTracing.shutdown());

  return {
    spans: async () => {
      // The processor exports a span after a promise that onEnd does not wait for.
      await (getLangfuseTracerProvider() as NodeTracerProvider).forceFlush();

      return exporter.getFinishedSpans();
    }
  };
};
