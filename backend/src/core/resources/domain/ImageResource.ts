import type {ImageContentType as ImageContentTypeValue} from 'contract/ContentType';
import type {IngestState as IngestStateValue} from 'contract/IngestState';
import type {ReasonCode} from 'contract/ReasonCode';
import {AggregateRoot} from '../../shared/domain/AggregateRoot';
import {FileKey} from '../../shared/domain/value-objects/FileKey';
import {IngestStateError} from './errors/IngestStateError';
import {ResourceNotFailedError} from './errors/ResourceNotFailedError';
import {ImageResourceCreatedDomainEvent} from './events/ImageResourceCreatedDomainEvent';
import {ImageResourceDeletedDomainEvent} from './events/ImageResourceDeletedDomainEvent';
import {ImageResourceRetriedDomainEvent} from './events/ImageResourceRetriedDomainEvent';
import {Checksum} from './value-objects/Checksum';
import {CreatedAt} from './value-objects/CreatedAt';
import {ImageContentType} from './value-objects/ImageContentType';
import {IngestState} from './value-objects/IngestState';
import {Reason} from './value-objects/Reason';
import {ResourceId} from './value-objects/ResourceId';
import {ResourceName} from './value-objects/ResourceName';

type ConstructorParams = {
  id: ResourceId;
  name: ResourceName;
  contentType: ImageContentType;
  fileKey: FileKey;
  checksum: Checksum;
  createdAt: CreatedAt;
  ingestState: IngestState;
  reason: Reason | undefined;
};

type CreateParams = Omit<ConstructorParams, 'ingestState' | 'reason'>;

export type ImageResourcePrimitives = {
  id: string;
  name: string;
  contentType: ImageContentTypeValue;
  fileKey: string;
  checksum: string;
  createdAt: string;
  ingestState: IngestStateValue;
  reason?: ReasonCode;
};

export class ImageResource extends AggregateRoot<ImageResourcePrimitives> {
  private readonly _id: ResourceId;
  private readonly _name: ResourceName;
  private readonly _contentType: ImageContentType;
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

  public static create(params: CreateParams): ImageResource {
    const imageResource = new ImageResource({
      ...params,
      ingestState: IngestState.ingesting(),
      reason: undefined
    });

    imageResource.registerEvent(
      new ImageResourceCreatedDomainEvent({
        aggregateId: params.id.value,
        contentType: params.contentType.value,
        fileKey: params.fileKey.value
      })
    );

    return imageResource;
  }

  public static fromPrimitives(primitives: ImageResourcePrimitives): ImageResource {
    return new ImageResource({
      id: ResourceId.fromPrimitive({value: primitives.id}),
      name: ResourceName.fromPrimitive({value: primitives.name}),
      contentType: ImageContentType.fromPrimitive({value: primitives.contentType}),
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
      new ImageResourceRetriedDomainEvent({
        aggregateId: this._id.value,
        contentType: this._contentType.value,
        fileKey: this._fileKey.value
      })
    );
  }

  public delete(): void {
    this.registerEvent(
      new ImageResourceDeletedDomainEvent({aggregateId: this._id.value})
    );
  }

  public toPrimitives(): ImageResourcePrimitives {
    const primitives: ImageResourcePrimitives = {
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
