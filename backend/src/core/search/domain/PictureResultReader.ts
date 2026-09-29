import type {Vector} from '../../shared/domain/value-objects/Vector';
import type {PictureResult} from './PictureResult';

// The Vector is of the Vision model.
export interface PictureResultReader {
  getBestFirst(vector: Vector): Promise<PictureResult[]>;
}
