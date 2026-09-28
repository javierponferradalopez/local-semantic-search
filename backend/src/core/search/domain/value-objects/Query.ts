import {ValueObjectError} from '../../../shared/domain/errors/ValueObjectError';
import {ValueObject} from '../../../shared/domain/value-objects/ValueObject';

type ConstructorParams = {value: string};

export class Query extends ValueObject<string> {
  private constructor(params: ConstructorParams) {
    super(params);
  }

  // The text reaches the embedder verbatim: a removed accent changes the ranking.
  public static of({value}: ConstructorParams): Query {
    if (value.trim().length === 0) {
      throw ValueObjectError.causeItIsEmpty(Query.name);
    }

    return new Query({value});
  }
}
