import type {IngestState as IngestStateValue} from 'contract/IngestState';
import {DomainError} from '../../../shared/domain/errors/DomainError';
import type {IngestState} from '../value-objects/IngestState';
import type {ResourceId} from '../value-objects/ResourceId';

export class ResourceNotFailedError extends DomainError {
  private readonly _resourceId: string;
  private readonly _ingestState: IngestStateValue;

  private constructor(resourceId: string, ingestState: IngestStateValue) {
    super(`The Resource ${resourceId} is ${ingestState}, and it is not ingested again`);
    this._resourceId = resourceId;
    this._ingestState = ingestState;
  }

  public static causeOnlyAFailedResourceIsRetried(
    resourceId: ResourceId,
    ingestState: IngestState
  ): ResourceNotFailedError {
    return new ResourceNotFailedError(resourceId.value, ingestState.value);
  }

  public get resourceId(): string {
    return this._resourceId;
  }

  public get ingestState(): IngestStateValue {
    return this._ingestState;
  }
}
