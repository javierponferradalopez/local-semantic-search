import type {ContentType} from '../value-objects/ContentType';

export interface ContentTypeResolver {
  resolve(name: string): ContentType;
}
