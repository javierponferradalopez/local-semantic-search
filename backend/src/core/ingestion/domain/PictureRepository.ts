import type {ResourceId} from '../../resources/domain/value-objects/ResourceId';
import type {Vector} from '../../shared/domain/value-objects/Vector';
import type {Picture} from './Picture';

export type EmbeddedPicture = {picture: Picture; vector: Vector};

export interface PictureRepository {
  create(embeddedPicture: EmbeddedPicture): Promise<void>;
  deleteManyByResourceId(resourceId: ResourceId): Promise<void>;
}
