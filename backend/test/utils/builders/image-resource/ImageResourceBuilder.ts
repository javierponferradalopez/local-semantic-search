import type {IngestState} from 'contract/IngestState';
import type {ReasonCode} from 'contract/ReasonCode';
import {
  ImageResource,
  type ImageResourcePrimitives
} from '../../../../src/core/resources/domain/ImageResource';
import {StringMother} from '../../object-mother/StringMother';

export class ImageResourceBuilder {
  private constructor(private readonly primitives: ImageResourcePrimitives) {}

  public static anImageResource(): ImageResourceBuilder {
    const id = StringMother.randomUuid();
    const name = StringMother.randomFileName('.pdf');

    return new ImageResourceBuilder({
      id,
      name,
      // No image Content type exists yet (#62), and the aggregate reads none, so a text one is sufficient.
      contentType: 'pdf',
      fileKey: `resources/${id}/${name}`,
      checksum: StringMother.randomChecksum(),
      createdAt: new Date().toISOString(),
      ingestState: 'ingesting'
    });
  }

  public withIngestState(ingestState: IngestState): ImageResourceBuilder {
    return new ImageResourceBuilder({...this.primitives, ingestState});
  }

  public withReason(reason: ReasonCode): ImageResourceBuilder {
    return new ImageResourceBuilder({...this.primitives, reason});
  }

  public build(): ImageResource {
    return ImageResource.fromPrimitives(this.primitives);
  }
}
