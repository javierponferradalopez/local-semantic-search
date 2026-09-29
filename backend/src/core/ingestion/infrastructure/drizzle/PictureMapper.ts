import type {EmbeddedPicture} from '../../domain/PictureRepository';
import type {pictures} from './PictureSchema';
import type {pictureVectors768} from './PictureVector768Schema';

type PictureRow = typeof pictures.$inferInsert;
type VectorRow = typeof pictureVectors768.$inferInsert;

export const PictureMapper = {
  toRows(
    {picture, vector}: EmbeddedPicture,
    id: string
  ): {picture: PictureRow; vector: VectorRow} {
    const primitives = picture.toPrimitives();

    return {
      picture: {
        id,
        resourceId: primitives.resourceId,
        thumbnailKey: primitives.thumbnailKey
      },
      vector: {
        pictureId: id,
        modelRepository: vector.model.repository,
        modelDtype: vector.model.dtype,
        modelWidth: vector.model.width,
        vector: [...vector.value]
      }
    };
  }
};
