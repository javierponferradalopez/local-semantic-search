import {TextResource, type TextResourcePrimitives} from '../../domain/TextResource';
import type {textResources} from './TextResourceSchema';

type TextResourceRow = typeof textResources.$inferSelect;

export const TextResourceMapper = {
  toDomain(row: TextResourceRow): TextResource {
    return TextResource.fromPrimitives(toPrimitives(row));
  },

  toRow(textResource: TextResource): TextResourceRow {
    const primitives = textResource.toPrimitives();

    return {
      id: primitives.id,
      name: primitives.name,
      contentType: primitives.contentType,
      fileKey: primitives.fileKey,
      checksum: primitives.checksum,
      createdAt: new Date(primitives.createdAt),
      ingestState: primitives.ingestState,
      reason: primitives.reason ?? null
    };
  }
};

const toPrimitives = (row: TextResourceRow): TextResourcePrimitives => {
  const primitives: TextResourcePrimitives = {
    id: row.id,
    name: row.name,
    contentType: row.contentType,
    fileKey: row.fileKey,
    checksum: row.checksum,
    createdAt: row.createdAt.toISOString(),
    ingestState: row.ingestState
  };

  if (row.reason === null) {
    return primitives;
  }

  return {...primitives, reason: row.reason};
};
