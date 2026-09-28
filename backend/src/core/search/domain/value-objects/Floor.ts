import {ValueObjectError} from '../../../shared/domain/errors/ValueObjectError';
import {ValueObject} from '../../../shared/domain/value-objects/ValueObject';
import type {Match} from '../Match';

type ConstructorParams = {value: number};

const VALUE_OBJECT_NAME = 'Floor';
const LEAST_COSINE = -1;
const MOST_COSINE = 1;

export class Floor extends ValueObject<number> {
  private constructor(params: ConstructorParams) {
    super(params);
  }

  public static of({value}: ConstructorParams): Floor {
    if (!(value >= LEAST_COSINE && value <= MOST_COSINE)) {
      throw ValueObjectError.causeItIsNotBetween(
        VALUE_OBJECT_NAME,
        value,
        LEAST_COSINE,
        MOST_COSINE
      );
    }

    return new Floor({value});
  }

  // A gate, not a filter: only the best Match is compared (ADR-0021).
  public isReachedBy([best]: readonly {bestMatch: Match}[]): boolean {
    return best !== undefined && best.bestMatch.score >= this.value;
  }
}
