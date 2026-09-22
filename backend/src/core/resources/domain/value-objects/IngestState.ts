import {ValueObjectError} from '../../../shared/domain/errors/ValueObjectError';
import {ValueObject} from '../../../shared/domain/value-objects/ValueObject';

export const INGEST_STATES = ['ingesting', 'ready', 'failed'] as const;

export type IngestStateValue = (typeof INGEST_STATES)[number];

type ConstructorParams = {value: IngestStateValue};

const VALUE_OBJECT_NAME = 'Ingest state';

const isIngestState = (value: string): value is IngestStateValue =>
  INGEST_STATES.some(ingestState => ingestState === value);

export class IngestState extends ValueObject<IngestStateValue> {
  private constructor(params: ConstructorParams) {
    super(params);
  }

  public static of({value}: {value: string}): IngestState {
    if (!isIngestState(value)) {
      throw ValueObjectError.causeItIsNotOneOf(VALUE_OBJECT_NAME, value, INGEST_STATES);
    }

    return new IngestState({value});
  }

  public static fromPrimitive(params: ConstructorParams): IngestState {
    return new IngestState(params);
  }

  public static ingesting(): IngestState {
    return new IngestState({value: 'ingesting'});
  }

  public static ready(): IngestState {
    return new IngestState({value: 'ready'});
  }

  public static failed(): IngestState {
    return new IngestState({value: 'failed'});
  }

  public isIngesting(): boolean {
    return this.value === 'ingesting';
  }

  public isFailed(): boolean {
    return this.value === 'failed';
  }
}
