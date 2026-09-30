import {isAnImageContentType} from 'contract/ContentType';
import type {ResourceRow} from 'contract/ResourceRow';
import {Picture} from '../../ingestion/domain/Picture';
import type {FileStore} from '../../shared/domain/services/FileStore';
import {FileKey} from '../../shared/domain/value-objects/FileKey';
import type {ListedResource} from '../domain/ListedResource';
import {ResourceId} from '../domain/value-objects/ResourceId';

type Params = {resource: ListedResource; fileStore: FileStore};

const hasAThumbnail = (resource: ListedResource): boolean =>
  resource.ingestState === 'ready' && isAnImageContentType(resource.contentType);

// The key comes from the id alone, so the row reads no Picture.
const thumbnailUrlOf = ({resource, fileStore}: Params): string =>
  fileStore.urlOf(Picture.thumbnailKeyOf(ResourceId.fromPrimitive({value: resource.id})));

export const resourceRowOf = ({resource, fileStore}: Params): ResourceRow => ({
  id: resource.id,
  name: resource.name,
  contentType: resource.contentType,
  ingestState: resource.ingestState,
  createdAt: resource.createdAt,
  fileUrl: fileStore.urlOf(FileKey.fromPrimitive({value: resource.fileKey})),
  ...(resource.reason !== undefined && {reason: resource.reason}),
  ...(hasAThumbnail(resource) && {thumbnailUrl: thumbnailUrlOf({resource, fileStore})})
});
