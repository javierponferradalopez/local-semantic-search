import type {Vector} from '../value-objects/Vector';

export type Pixels = {
  data: Uint8Array;
  width: number;
  height: number;
  channels: 1 | 2 | 3 | 4;
};

export interface ImageEmbedder {
  embedPicture(pixels: Pixels): Promise<Vector>;
  embedQuery(query: string): Promise<Vector>;
}
