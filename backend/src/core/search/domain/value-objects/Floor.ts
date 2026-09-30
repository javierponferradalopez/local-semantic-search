import {ValueObjectError} from '../../../shared/domain/errors/ValueObjectError';
import {ValueObject} from '../../../shared/domain/value-objects/ValueObject';
import type {Match} from '../Match';
import type {PictureMatch} from '../PictureMatch';

type ConstructorParams = {value: number};

const VALUE_OBJECT_NAME = 'Floor';

export class Floor extends ValueObject<number> {
  private constructor(params: ConstructorParams) {
    super(params);
  }

  public static of({value}: ConstructorParams): Floor {
    // A score of the model that judges the group: a logit has no bound (ADR-0040).
    if (!Number.isFinite(value)) {
      throw ValueObjectError.causeItHoldsANumberThatIsNotFinite(VALUE_OBJECT_NAME);
    }

    return new Floor({value});
  }

  // A gate, not a filter: only the best Match is compared (ADR-0021).
  // One overload for each model, so a list that mixes the two does not compile.
  public isReachedBy(results: readonly {bestMatch: Match}[]): boolean;
  public isReachedBy(results: readonly {bestMatch: PictureMatch}[]): boolean;
  public isReachedBy([best]: readonly {bestMatch: {score: number}}[]): boolean {
    return best !== undefined && best.bestMatch.score >= this.value;
  }
}
