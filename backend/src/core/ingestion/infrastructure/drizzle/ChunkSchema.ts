import {integer, pgTable, text, unique, uuid} from 'drizzle-orm/pg-core';

// The Resource is a plain value: no foreign key crosses a module (ADR-0020).
export const chunks = pgTable(
  'chunks',
  {
    id: uuid('id').primaryKey(),
    resourceId: uuid('resource_id').notNull(),
    text: text('text').notNull(),
    page: integer('page'),
    position: integer('position').notNull(),
    cutVersion: integer('cut_version').notNull()
  },
  table => [unique().on(table.resourceId, table.cutVersion, table.position)]
);
