import type {TextContentType} from 'contract/ContentType';
import {DomainEvent} from '../../../shared/domain/DomainEvent';

type ConstructorParams = {
  aggregateId: string;
  contentType: TextContentType;
  fileKey: string;
};

export class TextResourceRetriedDomainEvent extends DomainEvent {
  public static readonly EVENT_NAME = 'resources.text_resource.retried';

  private readonly _contentType: TextContentType;
  private readonly _fileKey: string;

  public constructor({aggregateId, contentType, fileKey}: ConstructorParams) {
    super({aggregateId});
    this._contentType = contentType;
    this._fileKey = fileKey;
  }

  public get contentType(): TextContentType {
    return this._contentType;
  }

  public get fileKey(): string {
    return this._fileKey;
  }

  public get eventName(): typeof TextResourceRetriedDomainEvent.EVENT_NAME {
    return TextResourceRetriedDomainEvent.EVENT_NAME;
  }
}
