import {ValueObjectError} from '../../../shared/domain/errors/ValueObjectError';
import {ValueObject} from '../../../shared/domain/value-objects/ValueObject';
import type {Match} from '../Match';
import type {PictureMatch} from '../PictureMatch';

type ConstructorParams = {value: number};

const VALUE_OBJECT_NAME = 'Margin';

export class Margin extends ValueObject<number> {
  private constructor(params: ConstructorParams) {
    super(params);
  }

  public static of({value}: ConstructorParams): Margin {
    if (!Number.isFinite(value)) {
      throw ValueObjectError.causeItHoldsANumberThatIsNotFinite(VALUE_OBJECT_NAME);
    }

    if (value < 0) {
      throw ValueObjectError.causeItIsBelowZero(VALUE_OBJECT_NAME);
    }

    return new Margin({value});
  }

  // The kept Results are a prefix of the list: the eval reads them so.
  // One overload for each model, so a list that mixes the two does not compile.
  public cut<T extends {bestMatch: Match}>(results: readonly T[]): T[];
  public cut<T extends {bestMatch: PictureMatch}>(results: readonly T[]): T[];
  public cut<T extends {bestMatch: {score: number}}>(results: readonly T[]): T[] {
    const [best] = results;

    if (best === undefined) {
      return [];
    }

    const edge = best.bestMatch.score - this.value;
    const end = results.findIndex(({bestMatch}) => bestMatch.score < edge);

    return end === -1 ? [...results] : results.slice(0, end);
  }
}
