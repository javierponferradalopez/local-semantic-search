import {
  Picture,
  type PicturePrimitives
} from '../../../../src/core/ingestion/domain/Picture';
import {StringMother} from '../../object-mother/StringMother';

export class PictureBuilder {
  private constructor(private readonly primitives: PicturePrimitives) {}

  public static aPicture(): PictureBuilder {
    const resourceId = StringMother.randomUuid();

    return new PictureBuilder({
      resourceId,
      thumbnailKey: `ingestion/thumbnails/${resourceId}.webp`
    });
  }

  public build(): Picture {
    return Picture.fromPrimitives(this.primitives);
  }
}
