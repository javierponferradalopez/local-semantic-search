import type {IngestState} from 'contract/IngestState';
import {eq} from 'drizzle-orm';
import {drizzle} from 'drizzle-orm/node-postgres';
import {DrizzlePictureRepository} from '../../../../../../src/core/ingestion/infrastructure/drizzle/DrizzlePictureRepository';
import {pictures} from '../../../../../../src/core/ingestion/infrastructure/drizzle/PictureSchema';
import {pictureVectors768} from '../../../../../../src/core/ingestion/infrastructure/drizzle/PictureVector768Schema';
import type {ImageResource} from '../../../../../../src/core/resources/domain/ImageResource';
import {DrizzleResourceRepository} from '../../../../../../src/core/resources/infrastructure/drizzle/DrizzleResourceRepository';
import {DrizzlePictureResultReader} from '../../../../../../src/core/search/infrastructure/drizzle/DrizzlePictureResultReader';
import type {ModelIdentity} from '../../../../../../src/core/shared/domain/value-objects/Vector';
import {DrizzleConnection} from '../../../../../../src/core/shared/infrastructure/drizzle/DrizzleConnection';
import {VISION_MODEL} from '../../../../../../src/core/shared/infrastructure/transformers/VisionModel';
import {testDatabase, wipeTheData} from '../../../../../lib/testInfrastructure';
import {ImageResourceBuilder} from '../../../../../utils/builders/image-resource/ImageResourceBuilder';
import {PictureBuilder} from '../../../../../utils/builders/picture/PictureBuilder';
import {StringMother} from '../../../../../utils/object-mother/StringMother';
import {VectorMother} from '../../../../../utils/object-mother/VectorMother';

const RESULTS_LIMIT = 24;

const TIED_RESOURCES = 12;

const TIE_LIMIT = 3;

const ANOTHER_MODEL: ModelIdentity = {...VISION_MODEL, repository: 'another/model'};

const ANOTHER_DTYPE: ModelIdentity = {...VISION_MODEL, dtype: 'q8'};

const theAxis = VectorMother.withSimilarityToTheAxis(1, VISION_MODEL);

describe('DrizzlePictureResultReader', () => {
  let resourceRepository: DrizzleResourceRepository;
  let pictureRepository: DrizzlePictureRepository;
  let connection: DrizzleConnection;
  let reader: DrizzlePictureResultReader;

  beforeEach(async () => {
    await wipeTheData();

    connection = new DrizzleConnection({database: drizzle(testDatabase())});
    resourceRepository = new DrizzleResourceRepository({connection});
    pictureRepository = new DrizzlePictureRepository({connection});
    reader = new DrizzlePictureResultReader({connection, resultsLimit: RESULTS_LIMIT});
  });

  const aResource = async (
    ingestState: IngestState = 'ready'
  ): Promise<ImageResource> => {
    const imageResource = ImageResourceBuilder.anImageResource()
      .withIngestState(ingestState)
      .build();
    await resourceRepository.create(imageResource);

    return imageResource;
  };

  const pictureOf = async (
    resourceId: string,
    similarity: number,
    model: ModelIdentity = VISION_MODEL
  ): Promise<void> => {
    await pictureRepository.create({
      picture: PictureBuilder.aPicture().withResourceId(resourceId).build(),
      vector: VectorMother.withSimilarityToTheAxis(similarity, model)
    });
  };

  // The repository writes one Vector for each Picture, so a second model is written by hand.
  const aVectorOfAnotherModel = async (
    resourceId: string,
    similarity: number,
    model: ModelIdentity = ANOTHER_MODEL
  ): Promise<void> => {
    const database = connection.database();
    const [picture] = await database
      .select({id: pictures.id})
      .from(pictures)
      .where(eq(pictures.resourceId, resourceId));
    const vector = VectorMother.withSimilarityToTheAxis(similarity, model);

    await database.insert(pictureVectors768).values({
      pictureId: picture?.id ?? '',
      modelRepository: model.repository,
      modelDtype: model.dtype,
      modelWidth: model.width,
      vector: [...vector.value]
    });
  };

  const idsOfTheResults = async (): Promise<string[]> =>
    (await reader.getBestFirst(theAxis)).map(result => result.resourceId);

  describe('#getBestFirst', () => {
    it('should give nothing when no Picture is stored', async () => {
      expect(await reader.getBestFirst(theAxis)).toStrictEqual([]);
    });

    it('should give one Result for each Resource', async () => {
      const first = await aResource();
      const second = await aResource();
      await pictureOf(first.id.value, 0.1);
      await pictureOf(second.id.value, 0.2);
      await aVectorOfAnotherModel(second.id.value, 0.3);

      expect((await idsOfTheResults()).toSorted()).toStrictEqual(
        [first.id.value, second.id.value].toSorted()
      );
    });

    it('should give the Resource, the thumbnail key and the best Match with its score', async () => {
      const resource = await aResource();
      await pictureOf(resource.id.value, 0.12);

      const [result] = await reader.getBestFirst(theAxis);
      const primitives = resource.toPrimitives();

      expect(result).toStrictEqual({
        resourceId: primitives.id,
        name: primitives.name,
        fileKey: primitives.fileKey,
        thumbnailKey: `ingestion/thumbnails/${primitives.id}.webp`,
        bestMatch: {score: expect.closeTo(0.12, 5)}
      });
    });

    it('should give the Resources nearest first', async () => {
      const far = await aResource();
      const near = await aResource();
      const middle = await aResource();
      await pictureOf(far.id.value, -0.05);
      await pictureOf(near.id.value, 0.16);
      await pictureOf(middle.id.value, 0.08);

      expect(await idsOfTheResults()).toStrictEqual([
        near.id.value,
        middle.id.value,
        far.id.value
      ]);
    });

    it('should order the Resources of an equal distance by their id, across the limit too', async () => {
      reader = new DrizzlePictureResultReader({connection, resultsLimit: TIE_LIMIT});
      const resources = await Promise.all(
        Array.from({length: TIED_RESOURCES}, () => aResource())
      );
      for (const resource of resources) {
        await pictureOf(resource.id.value, 0.1);
      }

      expect(await idsOfTheResults()).toStrictEqual(
        resources
          .map(resource => resource.id.value)
          .toSorted()
          .slice(0, TIE_LIMIT)
      );
    });

    it('should count the Resources in the limit', async () => {
      reader = new DrizzlePictureResultReader({connection, resultsLimit: 2});
      const best = await aResource();
      const second = await aResource();
      const third = await aResource();
      await pictureOf(best.id.value, 0.3);
      await aVectorOfAnotherModel(best.id.value, 0.9);
      await pictureOf(second.id.value, 0.2);
      await pictureOf(third.id.value, 0.1);

      expect(await idsOfTheResults()).toStrictEqual([best.id.value, second.id.value]);
    });

    it.each<IngestState>(['ingesting', 'failed'])(
      'should never give a Resource that is %s',
      async ingestState => {
        const notReady = await aResource(ingestState);
        await pictureOf(notReady.id.value, 0.1);

        expect(await idsOfTheResults()).toStrictEqual([]);
      }
    );

    it('should never give an orphan Picture', async () => {
      await pictureOf(StringMother.randomUuid(), 0.1);

      expect(await idsOfTheResults()).toStrictEqual([]);
    });

    it('should never read a Vector of another model', async () => {
      const onlyAnotherModel = await aResource();
      const both = await aResource();
      await pictureOf(onlyAnotherModel.id.value, 0.9, ANOTHER_MODEL);
      await pictureOf(both.id.value, 0.1);
      await aVectorOfAnotherModel(both.id.value, 0.9);

      const results = await reader.getBestFirst(theAxis);

      expect(results.map(result => result.resourceId)).toStrictEqual([both.id.value]);
      expect(results[0]?.bestMatch.score).toBeCloseTo(0.1, 5);
    });

    it('should never read a Vector of another dtype of the model', async () => {
      const resource = await aResource();
      await pictureOf(resource.id.value, 0.1);
      await aVectorOfAnotherModel(resource.id.value, 0.9, ANOTHER_DTYPE);

      const results = await reader.getBestFirst(theAxis);

      expect(results.map(result => result.resourceId)).toStrictEqual([resource.id.value]);
      expect(results[0]?.bestMatch.score).toBeCloseTo(0.1, 5);
    });
  });
});
