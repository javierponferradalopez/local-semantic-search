import type {Vector} from '../../shared/domain/value-objects/Vector';
import type {Result} from './Result';

export interface ResultReader {
  getBestFirst(vector: Vector): Promise<Result[]>;
}
