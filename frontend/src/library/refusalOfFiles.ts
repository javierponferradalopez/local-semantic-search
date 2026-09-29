import {CONTENT_TYPE_BY_EXTENSION} from 'contract/ContentTypeByExtension';
import type {ErrorItem} from 'contract/ErrorItem';
import {MAXIMUM_FILE_SIZE_IN_BYTES} from 'contract/MaximumFileSizeInBytes';
import {extensionOf} from '@/library/extensionOf';

export const refusalOfFiles = ([file, ...others]: File[]): ErrorItem | undefined => {
  if (others.length > 0) {
    return {code: 'multiple_files', params: {count: others.length + 1}};
  }

  if (!CONTENT_TYPE_BY_EXTENSION.has(extensionOf(file.name))) {
    return {code: 'unsupported_content_type', params: {name: file.name}};
  }

  if (file.size > MAXIMUM_FILE_SIZE_IN_BYTES) {
    return {
      code: 'file_too_large',
      params: {sizeInBytes: file.size, limitInBytes: MAXIMUM_FILE_SIZE_IN_BYTES}
    };
  }

  return undefined;
};
