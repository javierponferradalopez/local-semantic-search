import type {ImageResult} from './ImageResult';
import type {TextResult} from './TextResult';

export type SearchResponse = {text: TextResult[]; images: ImageResult[]};
