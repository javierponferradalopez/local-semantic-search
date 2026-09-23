import {DomainError} from '../../../shared/domain/errors/DomainError';
import type {ResourceId} from '../value-objects/ResourceId';

export class ResourceNotFoundError extends DomainError {
  private readonly _resourceId: string;

  private constructor(resourceId: string) {
    super(`No Resource holds the identifier ${resourceId}`);
    this._resourceId = resourceId;
  }

  public static causeNoResourceHoldsTheIdentifier(
    resourceId: ResourceId
  ): ResourceNotFoundError {
    return new ResourceNotFoundError(resourceId.value);
  }

  public get resourceId(): string {
    return this._resourceId;
  }
}
