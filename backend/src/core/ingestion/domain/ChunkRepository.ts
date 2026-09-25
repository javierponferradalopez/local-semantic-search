import type {ResourceId} from '../../resources/domain/value-objects/ResourceId';
import type {Vector} from '../../shared/domain/value-objects/Vector';
import type {Chunk} from './Chunk';

export type EmbeddedChunk = {chunk: Chunk; vector: Vector};

export interface ChunkRepository {
  createMany(embeddedChunks: readonly EmbeddedChunk[]): Promise<void>;
  deleteManyByResourceId(resourceId: ResourceId): Promise<void>;
}
