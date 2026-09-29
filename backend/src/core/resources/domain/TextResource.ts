import type {TextContentType as TextContentTypeValue} from 'contract/ContentType';
import type {IngestState as IngestStateValue} from 'contract/IngestState';
import type {ReasonCode} from 'contract/ReasonCode';
import {AggregateRoot} from '../../shared/domain/AggregateRoot';
import {FileKey} from '../../shared/domain/value-objects/FileKey';
import {IngestStateError} from './errors/IngestStateError';
import {ResourceNotFailedError} from './errors/ResourceNotFailedError';
import {TextResourceCreatedDomainEvent} from './events/TextResourceCreatedDomainEvent';
import {TextResourceDeletedDomainEvent} from './events/TextResourceDeletedDomainEvent';
import {TextResourceRetriedDomainEvent} from './events/TextResourceRetriedDomainEvent';
import {Checksum} from './value-objects/Checksum';
import {CreatedAt} from './value-objects/CreatedAt';
import {IngestState} from './value-objects/IngestState';
import {Reason} from './value-objects/Reason';
import {ResourceId} from './value-objects/ResourceId';
import {ResourceName} from './value-objects/ResourceName';
import {TextContentType} from './value-objects/TextContentType';

type ConstructorParams = {
  id: ResourceId;
  name: ResourceName;
  contentType: TextContentType;
  fileKey: FileKey;
  checksum: Checksum;
  createdAt: CreatedAt;
  ingestState: IngestState;
  reason: Reason | undefined;
};

type CreateParams = Omit<ConstructorParams, 'ingestState' | 'reason'>;

export type TextResourcePrimitives = {
  id: string;
  name: string;
  contentType: TextContentTypeValue;
  fileKey: string;
  checksum: string;
  createdAt: string;
  ingestState: IngestStateValue;
  reason?: ReasonCode;
};

export class TextResource extends AggregateRoot<TextResourcePrimitives> {
  private readonly _id: ResourceId;
  private readonly _name: ResourceName;
  private readonly _contentType: TextContentType;
  private readonly _fileKey: FileKey;
  private readonly _checksum: Checksum;
  private readonly _createdAt: CreatedAt;
  private _ingestState: IngestState;
  private _reason: Reason | undefined;

  private constructor(params: ConstructorParams) {
    super();
    this._id = params.id;
    this._name = params.name;
    this._contentType = params.contentType;
    this._fileKey = params.fileKey;
    this._checksum = params.checksum;
    this._createdAt = params.createdAt;
    this._ingestState = params.ingestState;
    this._reason = params.reason;
  }

  public static create(params: CreateParams): TextResource {
    const textResource = new TextResource({
      ...params,
      ingestState: IngestState.ingesting(),
      reason: undefined
    });

    textResource.registerEvent(
      new TextResourceCreatedDomainEvent({
        aggregateId: params.id.value,
        contentType: params.contentType.value,
        fileKey: params.fileKey.value
      })
    );

    return textResource;
  }

  public static fromPrimitives(primitives: TextResourcePrimitives): TextResource {
    return new TextResource({
      id: ResourceId.fromPrimitive({value: primitives.id}),
      name: ResourceName.fromPrimitive({value: primitives.name}),
      contentType: TextContentType.fromPrimitive({value: primitives.contentType}),
      fileKey: FileKey.fromPrimitive({value: primitives.fileKey}),
      checksum: Checksum.fromPrimitive({value: primitives.checksum}),
      createdAt: CreatedAt.fromPrimitive({value: primitives.createdAt}),
      ingestState: IngestState.fromPrimitive({value: primitives.ingestState}),
      reason:
        primitives.reason === undefined
          ? undefined
          : Reason.fromPrimitive({value: primitives.reason})
    });
  }

  public get id(): ResourceId {
    return this._id;
  }

  public get fileKey(): FileKey {
    return this._fileKey;
  }

  public get ingestState(): IngestState {
    return this._ingestState;
  }

  public markAsReady(): void {
    if (!this._ingestState.isIngesting()) {
      throw IngestStateError.causeOnlyAnIngestingResourceBecomesReady(this._ingestState);
    }

    this._ingestState = IngestState.ready();
  }

  public markAsFailed({reason}: {reason: Reason}): void {
    if (!this._ingestState.isIngesting()) {
      throw IngestStateError.causeOnlyAnIngestingResourceFails(this._ingestState);
    }

    this._ingestState = IngestState.failed();
    this._reason = reason;
  }

  public retry(): void {
    if (!this._ingestState.isFailed()) {
      throw ResourceNotFailedError.causeOnlyAFailedResourceIsRetried(
        this._id,
        this._ingestState
      );
    }

    this._ingestState = IngestState.ingesting();
    this._reason = undefined;

    this.registerEvent(
      new TextResourceRetriedDomainEvent({
        aggregateId: this._id.value,
        contentType: this._contentType.value,
        fileKey: this._fileKey.value
      })
    );
  }

  public delete(): void {
    this.registerEvent(new TextResourceDeletedDomainEvent({aggregateId: this._id.value}));
  }

  public toPrimitives(): TextResourcePrimitives {
    const primitives: TextResourcePrimitives = {
      id: this._id.value,
      name: this._name.value,
      contentType: this._contentType.value,
      fileKey: this._fileKey.value,
      checksum: this._checksum.value,
      createdAt: this._createdAt.value.toISOString(),
      ingestState: this._ingestState.value
    };

    if (this._reason === undefined) {
      return primitives;
    }

    return {...primitives, reason: this._reason.value};
  }
}
