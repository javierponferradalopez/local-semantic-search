import {type PropagateAttributesParams, propagateAttributes} from '@langfuse/tracing';
import {context, ROOT_CONTEXT} from '@opentelemetry/api';
import {NoSessionError} from '../../domain/errors/NoSessionError';
import type {OperationRunner} from '../../domain/services/OperationRunner';
import type {SessionRunner} from '../../domain/services/SessionRunner';
import {LazyTrace} from './LazyTrace';

type ConstructorParams = {sessionRunner: SessionRunner};

export class LangfuseOperationRunner implements OperationRunner {
  private readonly _sessionRunner: SessionRunner;

  public constructor({sessionRunner}: ConstructorParams) {
    this._sessionRunner = sessionRunner;
  }

  // Each operation is a root trace, also a handler that a request published (ADR-0048).
  public run<T>(name: string, work: () => Promise<T>, input: unknown): Promise<T> {
    return context.with(ROOT_CONTEXT, () => this.runInATrace(name, work, input));
  }

  private async runInATrace<T>(
    name: string,
    work: () => Promise<T>,
    input: unknown
  ): Promise<T> {
    let trace: LazyTrace;
    let attributes: PropagateAttributesParams;

    try {
      trace = LazyTrace.open(name, input);
      attributes = this.sessionAttributesOf(name);
    } catch (error) {
      console.error(`The trace of ${name} cannot open`, error);

      return work();
    }

    let output: T | undefined;

    try {
      output = await propagateAttributes(attributes, () => trace.run(work));

      return output;
    } finally {
      trace.end(output);
    }
  }

  // Only the route and its use case require the Session (ADR-0047).
  private sessionAttributesOf(name: string): PropagateAttributesParams {
    try {
      const session = this._sessionRunner.current();

      return {sessionId: session.id.value, tags: [session.origin.value]};
    } catch (error) {
      if (error instanceof NoSessionError) {
        console.warn(`The trace of ${name} has no Session`);

        return {};
      }

      throw error;
    }
  }
}
