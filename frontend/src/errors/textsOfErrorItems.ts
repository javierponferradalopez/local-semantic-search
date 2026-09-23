import type {ErrorItem} from 'contract/ErrorItem';
import {textOfErrorItem} from '@/errors/textOfErrorItem';

const SOMETHING_BROKE = 'Something broke on the server. Try again.';

export const textsOfErrorItems = (items: ErrorItem[]): string[] => {
  const texts = items.map(textOfErrorItem).filter(text => text !== undefined);

  return texts.length === 0 ? [SOMETHING_BROKE] : texts;
};
