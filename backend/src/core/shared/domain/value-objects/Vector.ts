import {ValueObjectError} from '../errors/ValueObjectError';
import {ValueObject} from './ValueObject';

export type ModelIdentity = {repository: string; dtype: string; width: number};

type ConstructorParams = {values: readonly number[]; model: ModelIdentity};

const VALUE_OBJECT_NAME = 'Vector';

export class Vector extends ValueObject<readonly number[]> {
  private readonly _model: ModelIdentity;

  private constructor({values, model}: ConstructorParams) {
    super({value: values});
    this._model = model;
  }

  public static of({values, model}: ConstructorParams): Vector {
    if (values.length === 0) {
      throw ValueObjectError.causeItIsEmpty(VALUE_OBJECT_NAME);
    }

    if (!values.every(Number.isFinite)) {
      throw ValueObjectError.causeItHoldsANumberThatIsNotFinite(VALUE_OBJECT_NAME);
    }

    if (values.length !== model.width) {
      throw ValueObjectError.causeItDoesNotHoldItsWidth(
        VALUE_OBJECT_NAME,
        values.length,
        model.width
      );
    }

    const {repository, dtype, width} = model;

    return new Vector({values: [...values], model: {repository, dtype, width}});
  }

  public static fromPrimitive(params: ConstructorParams): Vector {
    return new Vector(params);
  }

  public get model(): ModelIdentity {
    return this._model;
  }
}
