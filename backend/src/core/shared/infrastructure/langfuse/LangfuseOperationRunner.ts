import {type PropagateAttributesParams, propagateAttributes} from '@langfuse/tracing';
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

  public async run<T>(name: string, work: () => Promise<T>): Promise<T> {
    let trace: LazyTrace;
    let attributes: PropagateAttributesParams;

    try {
      trace = LazyTrace.open(name);
      attributes = this.sessionAttributesOf(name);
    } catch (error) {
      console.error(`The trace of ${name} cannot open`, error);

      return work();
    }

    try {
      return await propagateAttributes(attributes, () => trace.run(work));
    } finally {
      trace.end();
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
