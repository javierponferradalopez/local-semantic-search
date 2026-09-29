import {
  Picture,
  type PicturePrimitives
} from '../../../../src/core/ingestion/domain/Picture';
import {StringMother} from '../../object-mother/StringMother';

const primitivesOf = (resourceId: string): PicturePrimitives => ({
  resourceId,
  thumbnailKey: `ingestion/thumbnails/${resourceId}.webp`
});

export class PictureBuilder {
  private constructor(private readonly primitives: PicturePrimitives) {}

  public static aPicture(): PictureBuilder {
    return new PictureBuilder(primitivesOf(StringMother.randomUuid()));
  }

  public withResourceId(resourceId: string): PictureBuilder {
    return new PictureBuilder(primitivesOf(resourceId));
  }

  public build(): Picture {
    return Picture.fromPrimitives(this.primitives);
  }
}
