import type {ImageContentType} from 'contract/ContentType';
import type {IngestState} from 'contract/IngestState';
import type {ReasonCode} from 'contract/ReasonCode';
import {pgTable, text, timestamp, uuid} from 'drizzle-orm/pg-core';

export const imageResources = pgTable('image_resources', {
  id: uuid('id').primaryKey(),
  name: text('name').notNull(),
  contentType: text('content_type').$type<ImageContentType>().notNull(),
  fileKey: text('file_key').notNull(),
  checksum: text('checksum').notNull().unique(),
  createdAt: timestamp('created_at', {withTimezone: true}).notNull(),
  ingestState: text('ingest_state').$type<IngestState>().notNull(),
  reason: text('reason').$type<ReasonCode>()
});
