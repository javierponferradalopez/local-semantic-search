import type {IngestState} from 'contract/IngestState';
import {drizzle} from 'drizzle-orm/node-postgres';
import {CUT} from '../../../../../../src/core/ingestion/domain/Cut';
import {DrizzleChunkRepository} from '../../../../../../src/core/ingestion/infrastructure/drizzle/DrizzleChunkRepository';
import type {TextResource} from '../../../../../../src/core/resources/domain/TextResource';
import {ResourceId} from '../../../../../../src/core/resources/domain/value-objects/ResourceId';
import {DrizzleResourceRepository} from '../../../../../../src/core/resources/infrastructure/drizzle/DrizzleResourceRepository';
import {DrizzleResultReader} from '../../../../../../src/core/search/infrastructure/drizzle/DrizzleResultReader';
import type {ModelIdentity} from '../../../../../../src/core/shared/domain/value-objects/Vector';
import {DrizzleConnection} from '../../../../../../src/core/shared/infrastructure/drizzle/DrizzleConnection';
import {TEXT_MODEL} from '../../../../../../src/core/shared/infrastructure/transformers/TextModel';
import {testDatabase, wipeTheData} from '../../../../../lib/testInfrastructure';
import {ChunkBuilder} from '../../../../../utils/builders/chunk/ChunkBuilder';
import {TextResourceBuilder} from '../../../../../utils/builders/text-resource/TextResourceBuilder';
import {StringMother} from '../../../../../utils/object-mother/StringMother';
import {VectorMother} from '../../../../../utils/object-mother/VectorMother';

type AChunk = {
  similarity: number;
  text?: string;
  page?: number;
  cutVersion?: number;
  model?: ModelIdentity;
};

const RESULTS_LIMIT = 50;
const MATCHES_LIMIT = 10;

const ANOTHER_MODEL: ModelIdentity = {...TEXT_MODEL, repository: 'another/model'};

describe('DrizzleResultReader', () => {
  let resourceRepository: DrizzleResourceRepository;
  let chunkRepository: DrizzleChunkRepository;
  let connection: DrizzleConnection;
  let reader: DrizzleResultReader;

  beforeEach(async () => {
    await wipeTheData();

    connection = new DrizzleConnection({database: drizzle(testDatabase())});
    resourceRepository = new DrizzleResourceRepository({connection});
    chunkRepository = new DrizzleChunkRepository({connection});
    reader = new DrizzleResultReader({
      connection,
      resultsLimit: RESULTS_LIMIT,
      matchesLimit: MATCHES_LIMIT
    });
  });

  const aResource = async (ingestState: IngestState = 'ready'): Promise<TextResource> => {
    const textResource = TextResourceBuilder.aTextResource()
      .withIngestState(ingestState)
      .build();
    await resourceRepository.create(textResource);

    return textResource;
  };

  const chunksOf = async (resourceId: string, chunks: AChunk[]): Promise<void> => {
    await chunkRepository.createMany(
      chunks.map(
        ({similarity, text, page, cutVersion = CUT.version, model}, position) => {
          let builder = ChunkBuilder.aChunk()
            .withResourceId(resourceId)
            .withPosition(position)
            .withCutVersion(cutVersion);

          if (text !== undefined) {
            builder = builder.withText(text);
          }

          if (page !== undefined) {
            builder = builder.withPage(page);
          }

          return {
            chunk: builder.build(),
            vector: VectorMother.withSimilarityToTheAxis(similarity, model)
          };
        }
      )
    );
  };

  const idsOfTheResults = async (): Promise<string[]> =>
    (await reader.getBestFirst(VectorMother.axis())).map(result => result.resourceId);

  describe('#getBestFirst', () => {
    it('should give nothing when no Chunk is stored', async () => {
      expect(await reader.getBestFirst(VectorMother.axis())).toStrictEqual([]);
    });

    it('should give one Result for each Resource, with its best Match', async () => {
      const resource = await aResource();
      await chunksOf(resource.id.value, [
        {similarity: 0.5, text: 'The far Chunk.'},
        {similarity: 0.9, text: 'The near Chunk.'},
        {similarity: 0.7, text: 'The middle Chunk.'}
      ]);

      const results = await reader.getBestFirst(VectorMother.axis());

      expect(results).toHaveLength(1);
      expect(results[0]?.bestMatch.text).toBe('The near Chunk.');
    });

    it('should give the Resource and the best Match with its score', async () => {
      const resource = await aResource();
      await chunksOf(resource.id.value, [{similarity: 0.8, text: 'The Chunk.'}]);

      const [result] = await reader.getBestFirst(VectorMother.axis());
      const primitives = resource.toPrimitives();

      expect(result).toStrictEqual({
        resourceId: primitives.id,
        name: primitives.name,
        contentType: primitives.contentType,
        fileKey: primitives.fileKey,
        bestMatch: {text: 'The Chunk.', score: expect.closeTo(0.8, 5)}
      });
    });

    it('should carry the page of the best Match when the Chunk has one', async () => {
      const resource = await aResource();
      await chunksOf(resource.id.value, [{similarity: 0.8, page: 4}]);

      const [result] = await reader.getBestFirst(VectorMother.axis());

      expect(result?.bestMatch.page).toBe(4);
    });

    it('should keep no page key when the Chunk has none', async () => {
      const resource = await aResource();
      await chunksOf(resource.id.value, [{similarity: 0.8}]);

      const [result] = await reader.getBestFirst(VectorMother.axis());

      expect(result?.bestMatch).not.toHaveProperty('page');
    });

    it('should give the Resources nearest first', async () => {
      const far = await aResource();
      const near = await aResource();
      const middle = await aResource();
      await chunksOf(far.id.value, [{similarity: 0.2}]);
      await chunksOf(near.id.value, [{similarity: 0.9}]);
      await chunksOf(middle.id.value, [{similarity: 0.6}]);

      expect(await idsOfTheResults()).toStrictEqual([
        near.id.value,
        middle.id.value,
        far.id.value
      ]);
    });

    it('should count the Resources in the limit, and not the Matches', async () => {
      reader = new DrizzleResultReader({
        connection,
        resultsLimit: 2,
        matchesLimit: MATCHES_LIMIT
      });
      const long = await aResource();
      const second = await aResource();
      const third = await aResource();
      await chunksOf(long.id.value, [
        {similarity: 0.99},
        {similarity: 0.98},
        {similarity: 0.97}
      ]);
      await chunksOf(second.id.value, [{similarity: 0.5}]);
      await chunksOf(third.id.value, [{similarity: 0.4}]);

      expect(await idsOfTheResults()).toStrictEqual([long.id.value, second.id.value]);
    });

    it.each<IngestState>(['ingesting', 'failed'])(
      'should never give a Resource that is %s',
      async ingestState => {
        const notReady = await aResource(ingestState);
        await chunksOf(notReady.id.value, [{similarity: 0.9}]);

        expect(await idsOfTheResults()).toStrictEqual([]);
      }
    );

    it('should never give an orphan Chunk', async () => {
      await chunksOf(StringMother.randomUuid(), [{similarity: 0.9}]);

      expect(await idsOfTheResults()).toStrictEqual([]);
    });

    it('should never read a Vector of another model', async () => {
      const onlyAnotherModel = await aResource();
      const both = await aResource();
      await chunksOf(onlyAnotherModel.id.value, [
        {similarity: 0.99, model: ANOTHER_MODEL}
      ]);
      await chunksOf(both.id.value, [
        {similarity: 0.99, text: 'Another model.', model: ANOTHER_MODEL},
        {similarity: 0.5, text: 'The model in use.'}
      ]);

      const results = await reader.getBestFirst(VectorMother.axis());

      expect(results.map(result => result.resourceId)).toStrictEqual([both.id.value]);
      expect(results[0]?.bestMatch.text).toBe('The model in use.');
    });

    it('should read a Chunk of another cut version', async () => {
      const resource = await aResource();
      await chunksOf(resource.id.value, [
        {similarity: 0.5, text: 'The cut in use.'},
        {similarity: 0.9, text: 'Another cut.', cutVersion: CUT.version + 1}
      ]);

      const [result] = await reader.getBestFirst(VectorMother.axis());

      expect(result?.bestMatch.text).toBe('Another cut.');
    });
  });

  describe('#getMatchesBestFirst', () => {
    const textsOfTheMatches = async (resourceId: ResourceId): Promise<string[]> =>
      (await reader.getMatchesBestFirst(resourceId, VectorMother.axis())).map(
        match => match.text
      );

    it('should give the Matches of the Resource only, nearest first', async () => {
      const resource = await aResource();
      const another = await aResource();
      await chunksOf(resource.id.value, [
        {similarity: 0.5, text: 'The far Chunk.'},
        {similarity: 0.9, text: 'The near Chunk.'},
        {similarity: 0.7, text: 'The middle Chunk.'}
      ]);
      await chunksOf(another.id.value, [{similarity: 0.99, text: 'Another Resource.'}]);

      expect(await textsOfTheMatches(resource.id)).toStrictEqual([
        'The near Chunk.',
        'The middle Chunk.',
        'The far Chunk.'
      ]);
    });

    it('should give the text, the page and the score of each Match', async () => {
      const resource = await aResource();
      await chunksOf(resource.id.value, [
        {similarity: 0.8, text: 'The page.', page: 4},
        {similarity: 0.6, text: 'No page.'}
      ]);

      expect(
        await reader.getMatchesBestFirst(resource.id, VectorMother.axis())
      ).toStrictEqual([
        {text: 'The page.', page: 4, score: expect.closeTo(0.8, 5)},
        {text: 'No page.', score: expect.closeTo(0.6, 5)}
      ]);
    });

    it('should give ten Matches at most, the nearest ones', async () => {
      const resource = await aResource();
      await chunksOf(
        resource.id.value,
        Array.from({length: MATCHES_LIMIT + 2}, (_, index) => ({
          similarity: index / 20,
          text: `The Chunk ${index}.`
        }))
      );

      const texts = await textsOfTheMatches(resource.id);

      expect(texts).toHaveLength(MATCHES_LIMIT);
      expect(texts[0]).toBe(`The Chunk ${MATCHES_LIMIT + 1}.`);
      expect(texts).not.toContain('The Chunk 0.');
      expect(texts).not.toContain('The Chunk 1.');
    });

    it.each<IngestState>(['ingesting', 'failed'])(
      'should give nothing for a Resource that is %s',
      async ingestState => {
        const notReady = await aResource(ingestState);
        await chunksOf(notReady.id.value, [{similarity: 0.9}]);

        expect(await textsOfTheMatches(notReady.id)).toStrictEqual([]);
      }
    );

    it('should give nothing for an orphan Chunk', async () => {
      const orphan = StringMother.randomUuid();
      await chunksOf(orphan, [{similarity: 0.9}]);

      expect(await textsOfTheMatches(ResourceId.of({value: orphan}))).toStrictEqual([]);
    });

    it('should never read a Vector of another model', async () => {
      const resource = await aResource();
      await chunksOf(resource.id.value, [
        {similarity: 0.99, text: 'Another model.', model: ANOTHER_MODEL},
        {similarity: 0.5, text: 'The model in use.'}
      ]);

      expect(await textsOfTheMatches(resource.id)).toStrictEqual(['The model in use.']);
    });

    it('should read a Chunk of another cut version', async () => {
      const resource = await aResource();
      await chunksOf(resource.id.value, [
        {similarity: 0.5, text: 'The cut in use.'},
        {similarity: 0.9, text: 'Another cut.', cutVersion: CUT.version + 1}
      ]);

      expect(await textsOfTheMatches(resource.id)).toStrictEqual([
        'Another cut.',
        'The cut in use.'
      ]);
    });
  });
});
