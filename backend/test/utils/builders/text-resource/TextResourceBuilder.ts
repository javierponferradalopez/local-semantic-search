import {
  TextResource,
  type TextResourcePrimitives
} from '../../../../src/core/resources/domain/TextResource';
import type {IngestStateValue} from '../../../../src/core/resources/domain/value-objects/IngestState';
import type {ReasonValue} from '../../../../src/core/resources/domain/value-objects/Reason';
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

  public withIngestState(ingestState: IngestStateValue): TextResourceBuilder {
    return new TextResourceBuilder({...this.primitives, ingestState});
  }

  public withReason(reason: ReasonValue): TextResourceBuilder {
    return new TextResourceBuilder({...this.primitives, reason});
  }

  public build(): TextResource {
    return TextResource.fromPrimitives(this.primitives);
  }
}
