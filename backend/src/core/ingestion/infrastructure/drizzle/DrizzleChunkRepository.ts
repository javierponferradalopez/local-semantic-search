import {randomUUID} from 'node:crypto';
import {eq, inArray} from 'drizzle-orm';
import type {ResourceId} from '../../../resources/domain/value-objects/ResourceId';
import type {DrizzleConnection} from '../../../shared/infrastructure/drizzle/DrizzleConnection';
import type {ChunkRepository, EmbeddedChunk} from '../../domain/ChunkRepository';
import {ChunkMapper} from './ChunkMapper';
import {chunks} from './ChunkSchema';
import {vectors384} from './Vector384Schema';

type ConstructorParams = {connection: DrizzleConnection};

// Postgres takes at most 65535 parameters in one statement, and a row of chunks takes 6.
const ROWS_PER_STATEMENT = 1000;

const batchesOf = <T>(rows: readonly T[]): T[][] =>
  Array.from({length: Math.ceil(rows.length / ROWS_PER_STATEMENT)}, (_, index) =>
    rows.slice(index * ROWS_PER_STATEMENT, (index + 1) * ROWS_PER_STATEMENT)
  );

export class DrizzleChunkRepository implements ChunkRepository {
  private readonly connection: DrizzleConnection;

  public constructor({connection}: ConstructorParams) {
    this.connection = connection;
  }

  // A transaction of its own, or a savepoint inside the one that is open.
  public async createMany(embeddedChunks: readonly EmbeddedChunk[]): Promise<void> {
    if (embeddedChunks.length === 0) {
      return;
    }

    const rows = embeddedChunks.map(embeddedChunk =>
      ChunkMapper.toRows(embeddedChunk, randomUUID())
    );

    await this.connection.database().transaction(async transaction => {
      for (const batch of batchesOf(rows)) {
        await transaction.insert(chunks).values(batch.map(row => row.chunk));
        await transaction.insert(vectors384).values(batch.map(row => row.vector));
      }
    });
  }

  public async deleteManyByResourceId(resourceId: ResourceId): Promise<void> {
    await this.connection.database().transaction(async transaction => {
      const chunksOfTheResource = transaction
        .select({id: chunks.id})
        .from(chunks)
        .where(eq(chunks.resourceId, resourceId.value));

      await transaction
        .delete(vectors384)
        .where(inArray(vectors384.chunkId, chunksOfTheResource));
      await transaction.delete(chunks).where(eq(chunks.resourceId, resourceId.value));
    });
  }
}
