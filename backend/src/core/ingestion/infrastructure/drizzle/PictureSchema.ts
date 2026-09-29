import {pgTable, text, uuid} from 'drizzle-orm/pg-core';

// The Resource is a plain value: no foreign key crosses a module (ADR-0020).
export const pictures = pgTable('pictures', {
  id: uuid('id').primaryKey(),
  resourceId: uuid('resource_id').notNull().unique(),
  thumbnailKey: text('thumbnail_key').notNull()
});
