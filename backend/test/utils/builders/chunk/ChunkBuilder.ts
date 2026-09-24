import {Chunk, type ChunkPrimitives} from '../../../../src/core/ingestion/domain/Chunk';
import {CUT} from '../../../../src/core/ingestion/domain/Cut';
import {ChunkTextMother} from '../../object-mother/ChunkTextMother';
import {StringMother} from '../../object-mother/StringMother';

export class ChunkBuilder {
  private constructor(private readonly primitives: ChunkPrimitives) {}

  public static aChunk(): ChunkBuilder {
    return new ChunkBuilder({
      resourceId: StringMother.randomUuid(),
      text: ChunkTextMother.random(),
      position: 0,
      cutVersion: CUT.version
    });
  }

  public withPage(page: number): ChunkBuilder {
    return new ChunkBuilder({...this.primitives, page});
  }

  public withCutVersion(cutVersion: number): ChunkBuilder {
    return new ChunkBuilder({...this.primitives, cutVersion});
  }

  public build(): Chunk {
    return Chunk.fromPrimitives(this.primitives);
  }
}
