import {Origin} from './Origin';
import {SessionId} from './SessionId';
import {ValueObject} from './ValueObject';

type ConstructorParams = {id: SessionId; origin: Origin};

export class Session extends ValueObject<ConstructorParams> {
  private constructor(params: ConstructorParams) {
    super({value: params});
  }

  public static of({id, origin}: {id: string; origin: string}): Session {
    return new Session({
      id: SessionId.of({value: id}),
      origin: Origin.of({value: origin})
    });
  }

  public get id(): SessionId {
    return this.value.id;
  }

  public get origin(): Origin {
    return this.value.origin;
  }
}
