import {integer, pgTable, primaryKey, text, uuid, vector} from 'drizzle-orm/pg-core';
import {pictures} from './PictureSchema';

const WIDTH = 768;

export const pictureVectors768 = pgTable(
  'picture_vectors_768',
  {
    pictureId: uuid('picture_id')
      .notNull()
      .references(() => pictures.id),
    modelRepository: text('model_repository').notNull(),
    modelDtype: text('model_dtype').notNull(),
    modelWidth: integer('model_width').notNull(),
    vector: vector('vector', {dimensions: WIDTH}).notNull()
  },
  table => [
    primaryKey({columns: [table.pictureId, table.modelRepository, table.modelDtype]})
  ]
);
