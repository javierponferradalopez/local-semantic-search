import {LangfuseSpanProcessor, type LangfuseSpanProcessorParams} from '@langfuse/otel';
import {setLangfuseTracerProvider} from '@langfuse/tracing';
import {NodeTracerProvider} from '@opentelemetry/sdk-trace-node';

let provider: NodeTracerProvider | undefined;

export const LangfuseTracing = {
  // register() gives the process the context manager that propagateAttributes needs.
  start(params: LangfuseSpanProcessorParams): void {
    provider = new NodeTracerProvider({
      spanProcessors: [new LangfuseSpanProcessor(params)]
    });
    provider.register();
    setLangfuseTracerProvider(provider);
  },

  // The spans still in the batch when the process stops are lost (ADR-0048).
  async shutdown(): Promise<void> {
    await provider?.shutdown();
    setLangfuseTracerProvider(null);
    provider = undefined;
  }
};
