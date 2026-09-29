import type {ImageContentType} from 'contract/ContentType';
import {DomainEvent} from '../../../shared/domain/DomainEvent';

type ConstructorParams = {
  aggregateId: string;
  contentType: ImageContentType;
  fileKey: string;
};

export class ImageResourceCreatedDomainEvent extends DomainEvent {
  public static readonly EVENT_NAME = 'resources.image_resource.created';

  private readonly _contentType: ImageContentType;
  private readonly _fileKey: string;

  public constructor({aggregateId, contentType, fileKey}: ConstructorParams) {
    super({aggregateId});
    this._contentType = contentType;
    this._fileKey = fileKey;
  }

  public get contentType(): ImageContentType {
    return this._contentType;
  }

  public get fileKey(): string {
    return this._fileKey;
  }

  public get eventName(): typeof ImageResourceCreatedDomainEvent.EVENT_NAME {
    return ImageResourceCreatedDomainEvent.EVENT_NAME;
  }
}
