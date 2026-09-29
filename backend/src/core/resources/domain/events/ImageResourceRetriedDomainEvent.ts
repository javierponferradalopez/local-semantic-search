import type {ContentType} from 'contract/ContentType';
import {DomainEvent} from '../../../shared/domain/DomainEvent';

type ConstructorParams = {
  aggregateId: string;
  contentType: ContentType;
  fileKey: string;
};

export class ImageResourceRetriedDomainEvent extends DomainEvent {
  public static readonly EVENT_NAME = 'resources.image_resource.retried';

  private readonly _contentType: ContentType;
  private readonly _fileKey: string;

  public constructor({aggregateId, contentType, fileKey}: ConstructorParams) {
    super({aggregateId});
    this._contentType = contentType;
    this._fileKey = fileKey;
  }

  public get contentType(): ContentType {
    return this._contentType;
  }

  public get fileKey(): string {
    return this._fileKey;
  }

  public get eventName(): typeof ImageResourceRetriedDomainEvent.EVENT_NAME {
    return ImageResourceRetriedDomainEvent.EVENT_NAME;
  }
}
