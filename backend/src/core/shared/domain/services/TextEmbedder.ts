import type {Vector} from '../value-objects/Vector';

export interface TextEmbedder {
  embedChunk(text: string): Promise<Vector>;
  embedQuery(query: string): Promise<Vector>;
}
