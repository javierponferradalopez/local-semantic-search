import type {ResourceRow} from 'contract/ResourceRow';
import type {FileStore} from '../../shared/domain/services/FileStore';
import {FileKey} from '../../shared/domain/value-objects/FileKey';
import type {ListedResource} from '../domain/ListedResource';

type Params = {resource: ListedResource; fileStore: FileStore};

export const resourceRowOf = ({resource, fileStore}: Params): ResourceRow => {
  const row: ResourceRow = {
    id: resource.id,
    name: resource.name,
    contentType: resource.contentType,
    ingestState: resource.ingestState,
    createdAt: resource.createdAt,
    fileUrl: fileStore.urlOf(FileKey.fromPrimitive({value: resource.fileKey}))
  };

  if (resource.reason === undefined) {
    return row;
  }

  return {...row, reason: resource.reason};
};
