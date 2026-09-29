import {ImageResource, type ImageResourcePrimitives} from '../../domain/ImageResource';
import type {imageResources} from './ImageResourceSchema';

type ImageResourceRow = typeof imageResources.$inferSelect;

export const ImageResourceMapper = {
  toDomain(row: ImageResourceRow): ImageResource {
    return ImageResource.fromPrimitives(toPrimitives(row));
  },

  toRow(imageResource: ImageResource): ImageResourceRow {
    const primitives = imageResource.toPrimitives();

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

const toPrimitives = (row: ImageResourceRow): ImageResourcePrimitives => {
  const primitives: ImageResourcePrimitives = {
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
