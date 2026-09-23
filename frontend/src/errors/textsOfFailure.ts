import {textsOfErrorItems} from '@/errors/textsOfErrorItems';
import {Refusal} from '@/gateways/Refusal';

export const textsOfFailure = (failure: unknown): string[] =>
  textsOfErrorItems(failure instanceof Refusal ? failure.items : []);
