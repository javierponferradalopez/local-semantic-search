import type {IngestState} from 'contract/IngestState';
import {DomainError} from '../../../shared/domain/errors/DomainError';
import type {ImageResource} from '../ImageResource';
import type {TextResource} from '../TextResource';

export type DuplicateResource = {
  resourceId: string;
  name: string;
  ingestState: IngestState;
};

export class DuplicateResourceError extends DomainError {
  private readonly _resource: DuplicateResource;

  private constructor(resource: DuplicateResource) {
    super(`The bytes are already stored as the Resource ${resource.resourceId}`);
    this._resource = resource;
  }

  public static causeTheBytesAreAlreadyStored(
    resource: ImageResource | TextResource
  ): DuplicateResourceError {
    const {id, name, ingestState} = resource.toPrimitives();

    return new DuplicateResourceError({resourceId: id, name, ingestState});
  }

  public get resource(): DuplicateResource {
    return this._resource;
  }
}
