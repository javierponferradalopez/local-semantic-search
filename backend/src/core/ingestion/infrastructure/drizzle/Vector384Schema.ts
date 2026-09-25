import {integer, pgTable, primaryKey, text, uuid, vector} from 'drizzle-orm/pg-core';
import {chunks} from './ChunkSchema';

const WIDTH = 384;

export const vectors384 = pgTable(
  'vectors_384',
  {
    chunkId: uuid('chunk_id')
      .notNull()
      .references(() => chunks.id),
    modelRepository: text('model_repository').notNull(),
    modelDtype: text('model_dtype').notNull(),
    modelWidth: integer('model_width').notNull(),
    vector: vector('vector', {dimensions: WIDTH}).notNull()
  },
  table => [
    primaryKey({columns: [table.chunkId, table.modelRepository, table.modelDtype]})
  ]
);
