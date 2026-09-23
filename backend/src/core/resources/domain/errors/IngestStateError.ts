import {DomainError} from '../../../shared/domain/errors/DomainError';
import type {IngestState} from '../value-objects/IngestState';

export class IngestStateError extends DomainError {
  private constructor(message: string) {
    super(message);
  }

  public static causeOnlyAnIngestingResourceBecomesReady(
    ingestState: IngestState
  ): IngestStateError {
    return new IngestStateError(`A Resource that is ${ingestState.value} is not Ready`);
  }

  public static causeOnlyAnIngestingResourceFails(
    ingestState: IngestState
  ): IngestStateError {
    return new IngestStateError(`A Resource that is ${ingestState.value} does not fail`);
  }
}
