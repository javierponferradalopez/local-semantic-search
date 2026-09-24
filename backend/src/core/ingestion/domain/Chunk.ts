import {ResourceId} from '../../resources/domain/value-objects/ResourceId';
import {AggregateRoot} from '../../shared/domain/AggregateRoot';
import {CUT} from './Cut';
import {ChunkCreatedDomainEvent} from './events/ChunkCreatedDomainEvent';
import {ChunkText} from './value-objects/ChunkText';

type ConstructorParams = {
  resourceId: ResourceId;
  text: ChunkText;
  page: number | undefined;
  position: number;
  cutVersion: number;
};

type CreateParams = Omit<ConstructorParams, 'cutVersion'>;

export type ChunkPrimitives = {
  resourceId: string;
  text: string;
  page?: number;
  position: number;
  cutVersion: number;
};

export class Chunk extends AggregateRoot<ChunkPrimitives> {
  private readonly _resourceId: ResourceId;
  private readonly _text: ChunkText;
  private readonly _page: number | undefined;
  private readonly _position: number;
  private readonly _cutVersion: number;

  private constructor(params: ConstructorParams) {
    super();
    this._resourceId = params.resourceId;
    this._text = params.text;
    this._page = params.page;
    this._position = params.position;
    this._cutVersion = params.cutVersion;
  }

  public static create(params: CreateParams): Chunk {
    const chunk = new Chunk({...params, cutVersion: CUT.version});

    chunk.registerEvent(
      new ChunkCreatedDomainEvent({
        aggregateId: chunk._resourceId.value,
        position: chunk._position,
        cutVersion: chunk._cutVersion
      })
    );

    return chunk;
  }

  public static fromPrimitives(primitives: ChunkPrimitives): Chunk {
    return new Chunk({
      resourceId: ResourceId.fromPrimitive({value: primitives.resourceId}),
      text: ChunkText.fromPrimitive({value: primitives.text}),
      page: primitives.page,
      position: primitives.position,
      cutVersion: primitives.cutVersion
    });
  }

  public get text(): ChunkText {
    return this._text;
  }

  public toPrimitives(): ChunkPrimitives {
    const primitives: ChunkPrimitives = {
      resourceId: this._resourceId.value,
      text: this._text.value,
      position: this._position,
      cutVersion: this._cutVersion
    };

    if (this._page === undefined) {
      return primitives;
    }

    return {...primitives, page: this._page};
  }
}
