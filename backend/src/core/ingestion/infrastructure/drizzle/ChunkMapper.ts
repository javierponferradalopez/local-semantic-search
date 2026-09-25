import type {EmbeddedChunk} from '../../domain/ChunkRepository';
import type {chunks} from './ChunkSchema';
import type {vectors384} from './Vector384Schema';

type ChunkRow = typeof chunks.$inferInsert;
type VectorRow = typeof vectors384.$inferInsert;

export const ChunkMapper = {
  toRows(
    {chunk, vector}: EmbeddedChunk,
    id: string
  ): {chunk: ChunkRow; vector: VectorRow} {
    const primitives = chunk.toPrimitives();

    return {
      chunk: {
        id,
        resourceId: primitives.resourceId,
        text: primitives.text,
        page: primitives.page ?? null,
        position: primitives.position,
        cutVersion: primitives.cutVersion
      },
      vector: {
        chunkId: id,
        modelRepository: vector.model.repository,
        modelDtype: vector.model.dtype,
        modelWidth: vector.model.width,
        vector: [...vector.value]
      }
    };
  }
};
