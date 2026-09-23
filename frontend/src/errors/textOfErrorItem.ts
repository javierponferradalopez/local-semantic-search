import type {ErrorItem} from 'contract/ErrorItem';
import {textOfIngestState} from '@/library/textOfIngestState';
import {textOfSize} from '@/library/textOfSize';

type ParamsOf<Code extends ErrorItem['code']> = Extract<
  ErrorItem,
  {code: Code}
>['params'];

type TextOfEachCode = {
  [Code in ErrorItem['code']]: (params: ParamsOf<Code>) => string;
};

type ItemOf<Code extends ErrorItem['code']> = {
  [Each in Code]: {code: Each; params: ParamsOf<Each>};
}[Code];

const TEXT_BY_CODE: TextOfEachCode = {
  unsupported_content_type: ({name}: ParamsOf<'unsupported_content_type'>): string =>
    `The library cannot read "${name}". Its extension names no Content type.`,
  file_too_large: ({sizeInBytes, limitInBytes}: ParamsOf<'file_too_large'>): string =>
    `The file is ${textOfSize(sizeInBytes)}, and the limit is ${textOfSize(limitInBytes)}.`,
  duplicate_resource: ({name, ingestState}: ParamsOf<'duplicate_resource'>): string =>
    `These bytes are already in the library as "${name}", which is ${textOfIngestState(ingestState)}.`,
  multiple_files: ({count}: ParamsOf<'multiple_files'>): string =>
    `${count} files arrived. Drop one file at a time.`,
  resource_not_found: (): string =>
    'The library no longer holds this Resource. Reload the page.',
  resource_not_failed: ({ingestState}: ParamsOf<'resource_not_failed'>): string =>
    `This Resource is ${textOfIngestState(ingestState)}. Only a Failed Resource can be ingested again. Reload the page.`,
  invalid_input: ({path}: ParamsOf<'invalid_input'>): string =>
    `The server refused the value of "${path}".`
};

export const textOfErrorItem = <Code extends ErrorItem['code']>(
  item: ItemOf<Code>
): string | undefined => TEXT_BY_CODE[item.code]?.(item.params);
