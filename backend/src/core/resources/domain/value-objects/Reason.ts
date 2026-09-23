import {REASON_CODES, type ReasonCode} from 'contract/ReasonCode';
import {ValueObjectError} from '../../../shared/domain/errors/ValueObjectError';
import {ValueObject} from '../../../shared/domain/value-objects/ValueObject';

type ConstructorParams = {value: ReasonCode};

const VALUE_OBJECT_NAME = 'Reason';

const isReason = (value: string): value is ReasonCode =>
  REASON_CODES.some(reason => reason === value);

export class Reason extends ValueObject<ReasonCode> {
  private constructor(params: ConstructorParams) {
    super(params);
  }

  public static of({value}: {value: string}): Reason {
    if (!isReason(value)) {
      throw ValueObjectError.causeItIsNotOneOf(VALUE_OBJECT_NAME, value, REASON_CODES);
    }

    return new Reason({value});
  }

  public static fromPrimitive(params: ConstructorParams): Reason {
    return new Reason(params);
  }
}
