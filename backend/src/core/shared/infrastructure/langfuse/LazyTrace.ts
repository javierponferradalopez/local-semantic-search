import {type LangfuseSpan, startObservation} from '@langfuse/tracing';
import {context, createContextKey, type SpanContext} from '@opentelemetry/api';

const OPEN_TRACE = createContextKey('local-semantic-search.lazy-trace');

type ConstructorParams = {name: string; input: unknown; startTime: Date};

// The first Model call makes the trace, so an operation with no Model call sends nothing (ADR-0048).
export class LazyTrace {
  private readonly _name: string;
  private readonly _input: unknown;
  private readonly _startTime: Date;
  private _root: LangfuseSpan | undefined;
  private _ended = false;

  private constructor({name, input, startTime}: ConstructorParams) {
    this._name = name;
    this._input = input;
    this._startTime = startTime;
  }

  public static open(name: string, input: unknown): LazyTrace {
    return new LazyTrace({name, input, startTime: new Date()});
  }

  public static current(): LazyTrace | undefined {
    return context.active().getValue(OPEN_TRACE) as LazyTrace | undefined;
  }

  public run<T>(work: () => T): T {
    return context.with(context.active().setValue(OPEN_TRACE, this), work);
  }

  // A Model call after the end, as in a handler on the bus, opens no root: that root never ends.
  public rootSpanContext(): SpanContext | undefined {
    if (!this._ended) {
      this._root ??= startObservation(
        this._name,
        {input: this._input},
        {startTime: this._startTime}
      );
    }

    return this._root?.otelSpan.spanContext();
  }

  public end(output: unknown): void {
    this._ended = true;
    this._root?.update({output}).end();
  }
}
