type ConstructorParams<T> = {value: T};

export abstract class ValueObject<T> {
  private readonly _value: T;

  protected constructor({value}: ConstructorParams<T>) {
    this._value = value;
  }

  public get value(): T {
    return this._value;
  }
}
