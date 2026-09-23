import type {IngestState} from 'contract/IngestState';
import type {ReasonCode} from 'contract/ReasonCode';
import {
  TextResource,
  type TextResourcePrimitives
} from '../../../../src/core/resources/domain/TextResource';
import {StringMother} from '../../object-mother/StringMother';

export class TextResourceBuilder {
  private constructor(private readonly primitives: TextResourcePrimitives) {}

  public static aTextResource(): TextResourceBuilder {
    const id = StringMother.randomUuid();
    const name = StringMother.randomFileName('.md');

    return new TextResourceBuilder({
      id,
      name,
      contentType: 'markdown',
      fileKey: `resources/${id}/${name}`,
      checksum: StringMother.randomChecksum(),
      createdAt: new Date().toISOString(),
      ingestState: 'ingesting'
    });
  }

  public withIngestState(ingestState: IngestState): TextResourceBuilder {
    return new TextResourceBuilder({...this.primitives, ingestState});
  }

  public withCreatedAt(createdAt: string): TextResourceBuilder {
    return new TextResourceBuilder({...this.primitives, createdAt});
  }

  public withReason(reason: ReasonCode): TextResourceBuilder {
    return new TextResourceBuilder({...this.primitives, reason});
  }

  public build(): TextResource {
    return TextResource.fromPrimitives(this.primitives);
  }
}
