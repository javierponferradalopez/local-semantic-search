import {drizzle} from 'drizzle-orm/node-postgres';
import type {EmbeddedPicture} from '../../../../../../src/core/ingestion/domain/PictureRepository';
import {DrizzlePictureRepository} from '../../../../../../src/core/ingestion/infrastructure/drizzle/DrizzlePictureRepository';
import {ResourceId} from '../../../../../../src/core/resources/domain/value-objects/ResourceId';
import {Vector} from '../../../../../../src/core/shared/domain/value-objects/Vector';
import {DrizzleConnection} from '../../../../../../src/core/shared/infrastructure/drizzle/DrizzleConnection';
import {VISION_MODEL} from '../../../../../../src/core/shared/infrastructure/transformers/VisionModel';
import {testDatabase, wipeTheData} from '../../../../../lib/testInfrastructure';
import {PictureBuilder} from '../../../../../utils/builders/picture/PictureBuilder';

type PictureRow = {id: string; resource_id: string; thumbnail_key: string};

type VectorRow = {
  picture_id: string;
  model_repository: string;
  model_dtype: string;
  model_width: number;
  vector: string;
};

// Written by hand, so that the test reads back the values it knows.
const aVectorOf = (first: number): Vector =>
  Vector.of({
    values: Array.from({length: VISION_MODEL.width}, (_, index) =>
      index === 0 ? first : 0
    ),
    model: VISION_MODEL
  });

const anEmbeddedPicture = (resourceId: ResourceId, first = 1): EmbeddedPicture => ({
  picture: PictureBuilder.aPicture().withResourceId(resourceId.value).build(),
  vector: aVectorOf(first)
});

const pictureRowsOf = async (resourceId: ResourceId): Promise<PictureRow[]> =>
  (
    await testDatabase().query<PictureRow>(
      'SELECT * FROM pictures WHERE resource_id = $1',
      [resourceId.value]
    )
  ).rows;

const vectorRowsOf = async (resourceId: ResourceId): Promise<VectorRow[]> =>
  (
    await testDatabase().query<VectorRow>(
      `SELECT picture_vectors_768.* FROM picture_vectors_768
       JOIN pictures ON pictures.id = picture_vectors_768.picture_id
       WHERE pictures.resource_id = $1`,
      [resourceId.value]
    )
  ).rows;

describe('DrizzlePictureRepository', () => {
  let repository: DrizzlePictureRepository;

  beforeEach(async () => {
    await wipeTheData();
    repository = new DrizzlePictureRepository({
      connection: new DrizzleConnection({database: drizzle(testDatabase())})
    });
  });

  describe('#create', () => {
    it('should write a row with what the Picture holds', async () => {
      const resourceId = ResourceId.random();

      await repository.create(anEmbeddedPicture(resourceId));

      const rows = await pictureRowsOf(resourceId);

      expect(rows.map(({id, ...row}) => row)).toStrictEqual([
        {
          resource_id: resourceId.value,
          thumbnail_key: `ingestion/thumbnails/${resourceId.value}.webp`
        }
      ]);
    });

    it('should write the Vector of the Picture with the model that made it', async () => {
      const resourceId = ResourceId.random();

      await repository.create(anEmbeddedPicture(resourceId, 0.5));

      const [row] = await vectorRowsOf(resourceId);
      const values = JSON.parse(row?.vector ?? '[]') as number[];

      expect(row).toMatchObject({
        model_repository: VISION_MODEL.repository,
        model_dtype: VISION_MODEL.dtype,
        model_width: VISION_MODEL.width
      });
      expect(values).toHaveLength(VISION_MODEL.width);
      expect(values[0]).toBeCloseTo(0.5, 5);
      expect(values.slice(1).every(value => value === 0)).toBe(true);
    });

    it('should refuse a second Picture of the same Resource, and write no second row', async () => {
      const resourceId = ResourceId.random();
      await repository.create(anEmbeddedPicture(resourceId));

      await expect(repository.create(anEmbeddedPicture(resourceId))).rejects.toThrow();

      expect(await pictureRowsOf(resourceId)).toHaveLength(1);
      expect(await vectorRowsOf(resourceId)).toHaveLength(1);
    });
  });

  describe('#deleteManyByResourceId', () => {
    it('should remove the Picture and the Vector of the Resource alone', async () => {
      const deleted = ResourceId.random();
      const kept = ResourceId.random();
      await repository.create(anEmbeddedPicture(deleted));
      await repository.create(anEmbeddedPicture(kept));

      await repository.deleteManyByResourceId(deleted);

      expect(await pictureRowsOf(deleted)).toStrictEqual([]);
      expect(await vectorRowsOf(deleted)).toStrictEqual([]);
      expect(await pictureRowsOf(kept)).toHaveLength(1);
      expect(await vectorRowsOf(kept)).toHaveLength(1);
    });

    it('should take a Resource that holds no Picture', async () => {
      await expect(
        repository.deleteManyByResourceId(ResourceId.random())
      ).resolves.toBeUndefined();
    });
  });
});
