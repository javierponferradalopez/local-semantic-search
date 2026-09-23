import type {ErrorItem} from 'contract/ErrorItem';
import {textOfIngestState} from '@/library/textOfIngestState';

type ParamsOf<Code extends ErrorItem['code']> = Extract<
  ErrorItem,
  {code: Code}
>['params'];

type TextOfEachCode = {
  [Code in ErrorItem['code']]: (params: ParamsOf<Code>) => string;
};

const TEXT_BY_CODE: TextOfEachCode = {
  duplicate_resource: ({name, ingestState}: ParamsOf<'duplicate_resource'>): string =>
    `These bytes are already in the library as "${name}", which is ${textOfIngestState(ingestState)}.`
};

export const textOfErrorItem = (item: ErrorItem): string | undefined =>
  TEXT_BY_CODE[item.code]?.(item.params);
