import type {PictureMatch} from './PictureMatch';

export type PictureResult = {
  resourceId: string;
  name: string;
  fileKey: string;
  thumbnailKey: string;
  bestMatch: PictureMatch;
};
