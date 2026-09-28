import type {ResourceId} from '../../resources/domain/value-objects/ResourceId';
import type {Vector} from '../../shared/domain/value-objects/Vector';
import type {Match} from './Match';
import type {Result} from './Result';

export interface ResultReader {
  getBestFirst(vector: Vector): Promise<Result[]>;
  getMatchesBestFirst(resourceId: ResourceId, vector: Vector): Promise<Match[]>;
}
