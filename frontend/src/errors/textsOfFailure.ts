import {textOfErrorItem} from '@/errors/textOfErrorItem';
import {Refusal} from '@/gateways/Refusal';

const SOMETHING_BROKE = 'Something broke on the server. Try again.';

export const textsOfFailure = (failure: unknown): string[] => {
  const texts =
    failure instanceof Refusal
      ? failure.items.map(textOfErrorItem).filter(text => text !== undefined)
      : [];

  return texts.length === 0 ? [SOMETHING_BROKE] : texts;
};
