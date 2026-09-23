import type {IngestState} from './IngestState';

type UnsupportedContentType = {
  code: 'unsupported_content_type';
  params: {name: string};
};

type FileTooLarge = {
  code: 'file_too_large';
  params: {sizeInBytes: number; limitInBytes: number};
};

type DuplicateResource = {
  code: 'duplicate_resource';
  params: {resourceId: string; name: string; ingestState: IngestState};
};

type MultipleFiles = {
  code: 'multiple_files';
  params: {count: number};
};

type ResourceNotFound = {
  code: 'resource_not_found';
  params: {resourceId: string};
};

type ResourceNotFailed = {
  code: 'resource_not_failed';
  params: {resourceId: string; ingestState: IngestState};
};

type InvalidInput = {
  code: 'invalid_input';
  params: {path: string};
};

export type ErrorItem =
  | UnsupportedContentType
  | FileTooLarge
  | DuplicateResource
  | MultipleFiles
  | ResourceNotFound
  | ResourceNotFailed
  | InvalidInput;
