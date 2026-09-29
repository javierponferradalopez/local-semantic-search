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
    const name = StringMother.randomFileName('.png');

    return new ImageResourceBuilder({
      id,
      name,
      contentType: 'png',
      fileKey: `resources/${id}/${name}`,
      checksum: StringMother.randomChecksum(),
      createdAt: new Date().toISOString(),
      ingestState: 'ingesting'
    });
  }

  public withName(name: string): ImageResourceBuilder {
    return new ImageResourceBuilder({...this.primitives, name});
  }

  public withChecksum(checksum: string): ImageResourceBuilder {
    return new ImageResourceBuilder({...this.primitives, checksum});
  }

  public withIngestState(ingestState: IngestState): ImageResourceBuilder {
    return new ImageResourceBuilder({...this.primitives, ingestState});
  }

  public withCreatedAt(createdAt: string): ImageResourceBuilder {
    return new ImageResourceBuilder({...this.primitives, createdAt});
  }

  public withReason(reason: ReasonCode): ImageResourceBuilder {
    return new ImageResourceBuilder({...this.primitives, reason});
  }

  public build(): ImageResource {
    return ImageResource.fromPrimitives(this.primitives);
  }
}
