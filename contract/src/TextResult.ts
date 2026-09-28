import type {ContentType} from './ContentType';

export type TextResult = {
  resourceId: string;
  name: string;
  contentType: ContentType;
  text: string;
  page?: number;
  fileUrl: string;
};
