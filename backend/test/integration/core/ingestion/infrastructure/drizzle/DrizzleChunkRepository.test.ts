import {drizzle} from 'drizzle-orm/node-postgres';
import type {EmbeddedChunk} from '../../../../../../src/core/ingestion/domain/ChunkRepository';
import {CUT} from '../../../../../../src/core/ingestion/domain/Cut';
import {DrizzleChunkRepository} from '../../../../../../src/core/ingestion/infrastructure/drizzle/DrizzleChunkRepository';
import {ResourceId} from '../../../../../../src/core/resources/domain/value-objects/ResourceId';
import {DrizzleConnection} from '../../../../../../src/core/shared/infrastructure/drizzle/DrizzleConnection';
import {TEXT_MODEL} from '../../../../../../src/core/shared/infrastructure/transformers/TextModel';
import {testDatabase, wipeTheData} from '../../../../../lib/testInfrastructure';
import {ChunkBuilder} from '../../../../../utils/builders/chunk/ChunkBuilder';
import {VectorMother} from '../../../../../utils/object-mother/VectorMother';

type ChunkRow = {
  id: string;
  resource_id: string;
  text: string;
  page: number | null;
  position: number;
  cut_version: number;
};

type VectorRow = {
  chunk_id: string;
  model_repository: string;
  model_dtype: string;
  model_width: number;
  vector: string;
};

const anEmbeddedChunk = (
  resourceId: ResourceId,
  position: number,
  cutVersion: number = CUT.version
): EmbeddedChunk => ({
  chunk: ChunkBuilder.aChunk()
    .withResourceId(resourceId.value)
    .withPosition(position)
    .withCutVersion(cutVersion)
    .build(),
  vector: VectorMother.random()
});

const chunkRowsOf = async (resourceId: ResourceId): Promise<ChunkRow[]> =>
  (
    await testDatabase().query<ChunkRow>(
      'SELECT * FROM chunks WHERE resource_id = $1 ORDER BY position',
      [resourceId.value]
    )
  ).rows;

const vectorRowsOf = async (resourceId: ResourceId): Promise<VectorRow[]> =>
  (
    await testDatabase().query<VectorRow>(
      `SELECT vectors_384.* FROM vectors_384
       JOIN chunks ON chunks.id = vectors_384.chunk_id
       WHERE chunks.resource_id = $1
       ORDER BY chunks.position`,
      [resourceId.value]
    )
  ).rows;

describe('DrizzleChunkRepository', () => {
  let repository: DrizzleChunkRepository;

  beforeEach(async () => {
    await wipeTheData();
    repository = new DrizzleChunkRepository({
      connection: new DrizzleConnection({database: drizzle(testDatabase())})
    });
  });

  describe('#saveAll', () => {
    it('should write a row for each Chunk, with what the Chunk holds', async () => {
      const resourceId = ResourceId.random();
      const first = anEmbeddedChunk(resourceId, 0);
      const second = {
        ...anEmbeddedChunk(resourceId, 1),
        chunk: ChunkBuilder.aChunk()
          .withResourceId(resourceId.value)
          .withPosition(1)
          .withPage(4)
          .build()
      };

      await repository.saveAll([first, second]);

      const rows = await chunkRowsOf(resourceId);

      expect(rows.map(({id, ...row}) => row)).toStrictEqual([
        {
          resource_id: resourceId.value,
          text: first.chunk.text.value,
          page: null,
          position: 0,
          cut_version: CUT.version
        },
        {
          resource_id: resourceId.value,
          text: second.chunk.text.value,
          page: 4,
          position: 1,
          cut_version: CUT.version
        }
      ]);
    });

    it('should write the Vector of each Chunk with the model that made it', async () => {
      const resourceId = ResourceId.random();
      const embedded = anEmbeddedChunk(resourceId, 0);

      await repository.saveAll([embedded]);

      const [row] = await vectorRowsOf(resourceId);
      const values = JSON.parse(row?.vector ?? '[]') as number[];

      expect(row).toMatchObject({
        model_repository: TEXT_MODEL.repository,
        model_dtype: TEXT_MODEL.dtype,
        model_width: TEXT_MODEL.width
      });
      expect(values).toHaveLength(TEXT_MODEL.width);
      values.forEach((value, index) => {
        expect(value).toBeCloseTo(embedded.vector.value[index] ?? Number.NaN, 5);
      });
    });

    it('should refuse two Chunks with the same position and cut version, and write nothing', async () => {
      const resourceId = ResourceId.random();

      await expect(
        repository.saveAll([
          anEmbeddedChunk(resourceId, 0),
          anEmbeddedChunk(resourceId, 1),
          anEmbeddedChunk(resourceId, 1)
        ])
      ).rejects.toThrow();

      expect(await chunkRowsOf(resourceId)).toStrictEqual([]);
      expect(await vectorRowsOf(resourceId)).toStrictEqual([]);
    });

    it('should write nothing when the last of many Chunks is refused', async () => {
      const resourceId = ResourceId.random();
      const many = Array.from({length: 1500}, (_, position) =>
        anEmbeddedChunk(resourceId, position)
      );

      await expect(
        repository.saveAll([...many, anEmbeddedChunk(resourceId, 0)])
      ).rejects.toThrow();

      expect(await chunkRowsOf(resourceId)).toStrictEqual([]);
    });

    it('should take the same position under another cut version', async () => {
      const resourceId = ResourceId.random();

      await repository.saveAll([
        anEmbeddedChunk(resourceId, 0, CUT.version),
        anEmbeddedChunk(resourceId, 0, CUT.version + 1)
      ]);

      expect(await chunkRowsOf(resourceId)).toHaveLength(2);
    });

    it('should take the same position in another Resource', async () => {
      await repository.saveAll([anEmbeddedChunk(ResourceId.random(), 0)]);

      await expect(
        repository.saveAll([anEmbeddedChunk(ResourceId.random(), 0)])
      ).resolves.toBeUndefined();
    });

    it('should take no Chunk at all', async () => {
      await expect(repository.saveAll([])).resolves.toBeUndefined();
    });
  });

  describe('#deleteAllOf', () => {
    it('should remove the Chunks and the Vectors of the Resource alone', async () => {
      const deleted = ResourceId.random();
      const kept = ResourceId.random();
      await repository.saveAll([
        anEmbeddedChunk(deleted, 0),
        anEmbeddedChunk(deleted, 1)
      ]);
      await repository.saveAll([anEmbeddedChunk(kept, 0)]);

      await repository.deleteAllOf(deleted);

      expect(await chunkRowsOf(deleted)).toStrictEqual([]);
      expect(await vectorRowsOf(deleted)).toStrictEqual([]);
      expect(await chunkRowsOf(kept)).toHaveLength(1);
      expect(await vectorRowsOf(kept)).toHaveLength(1);
    });
  });
});
