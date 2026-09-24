import type {ContentType} from 'contract/ContentType';
import type {ResourceId} from '../../resources/domain/value-objects/ResourceId';
import type {Chunk} from './Chunk';

type CutParams = {
  resourceId: ResourceId;
  contentType: ContentType;
  texts: readonly string[];
};

export interface Cutter {
  cut(params: CutParams): Chunk[];
}
