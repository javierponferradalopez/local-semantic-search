import {ValueObjectError} from '../../../shared/domain/errors/ValueObjectError';
import {ValueObject} from '../../../shared/domain/value-objects/ValueObject';

export const REASONS = [
  'no_text_found',
  'image_too_large',
  'unreadable_file',
  'ingest_error'
] as const;

export type ReasonValue = (typeof REASONS)[number];

type ConstructorParams = {value: ReasonValue};

const VALUE_OBJECT_NAME = 'Reason';

const isReason = (value: string): value is ReasonValue =>
  REASONS.some(reason => reason === value);

export class Reason extends ValueObject<ReasonValue> {
  private constructor(params: ConstructorParams) {
    super(params);
  }

  public static of({value}: {value: string}): Reason {
    if (!isReason(value)) {
      throw ValueObjectError.causeItIsNotOneOf(VALUE_OBJECT_NAME, value, REASONS);
    }

    return new Reason({value});
  }

  public static fromPrimitive(params: ConstructorParams): Reason {
    return new Reason(params);
  }
}
