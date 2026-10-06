import {and, asc, cosineDistance, eq, type SQL} from 'drizzle-orm';
import {chunks} from '../../../ingestion/infrastructure/drizzle/ChunkSchema';
import {vectors384} from '../../../ingestion/infrastructure/drizzle/Vector384Schema';
import type {ResourceId} from '../../../resources/domain/value-objects/ResourceId';
import {textResources} from '../../../resources/infrastructure/drizzle/TextResourceSchema';
import type {Vector} from '../../../shared/domain/value-objects/Vector';
import type {DrizzleConnection} from '../../../shared/infrastructure/drizzle/DrizzleConnection';
import type {Match} from '../../domain/Match';
import type {Result} from '../../domain/Result';
import type {ResultReader} from '../../domain/ResultReader';

type ConstructorParams = {
  connection: DrizzleConnection;
  resultsLimit: number;
  matchesLimit: number;
};

type ChunkDistanceRow = {text: string; page: number | null; distance: number};

export class DrizzleResultReader implements ResultReader {
  private readonly connection: DrizzleConnection;
  private readonly resultsLimit: number;
  private readonly matchesLimit: number;

  public constructor({connection, resultsLimit, matchesLimit}: ConstructorParams) {
    this.connection = connection;
    this.resultsLimit = resultsLimit;
    this.matchesLimit = matchesLimit;
  }

  public async getBestFirst(vector: Vector): Promise<Result[]> {
    const database = this.connection.database();
    const distance = distanceTo(vector);

    // DISTINCT ON keeps the best Chunk of each Resource, so the limit counts Results (ADR-0002).
    const bestMatches = database
      .selectDistinctOn([chunks.resourceId], {
        resourceId: chunks.resourceId,
        name: textResources.name,
        contentType: textResources.contentType,
        fileKey: textResources.fileKey,
        text: chunks.text,
        page: chunks.page,
        distance: distance.as('distance')
      })
      .from(chunks)
      .innerJoin(vectors384, eq(vectors384.chunkId, chunks.id))
      // The INNER JOIN also drops an orphan Chunk, which has no Resource to join (ADR-0020).
      .innerJoin(textResources, eq(textResources.id, chunks.resourceId))
      .where(isReadyAndOfTheModelOf(vector))
      // The id breaks a tie, so that the same Query always gives the same Match.
      .orderBy(chunks.resourceId, distance, chunks.id)
      .as('best_matches');

    const rows = await database
      .select()
      .from(bestMatches)
      .orderBy(asc(bestMatches.distance), asc(bestMatches.resourceId))
      .limit(this.resultsLimit);

    return rows.map(({text, page, distance: rowDistance, ...resource}) => ({
      ...resource,
      bestMatch: matchOf({text, page, distance: rowDistance})
    }));
  }

  public async getMatchesBestFirst(
    resourceId: ResourceId,
    vector: Vector
  ): Promise<Match[]> {
    const distance = distanceTo(vector);

    const rows = await this.connection
      .database()
      .select({text: chunks.text, page: chunks.page, distance})
      .from(chunks)
      .innerJoin(vectors384, eq(vectors384.chunkId, chunks.id))
      .innerJoin(textResources, eq(textResources.id, chunks.resourceId))
      .where(and(eq(chunks.resourceId, resourceId.value), isReadyAndOfTheModelOf(vector)))
      .orderBy(asc(distance), asc(chunks.id))
      .limit(this.matchesLimit);

    return rows.map(matchOf);
  }
}

const distanceTo = (vector: Vector): SQL<number> =>
  cosineDistance(vectors384.vector, [...vector.value]).mapWith(Number);

// The filter is by model and never by cut version: two cuts share one space (ADR-0010).
const isReadyAndOfTheModelOf = (vector: Vector): SQL | undefined =>
  and(
    eq(textResources.ingestState, 'ready'),
    eq(vectors384.modelRepository, vector.model.repository),
    eq(vectors384.modelDtype, vector.model.dtype)
  );

const matchOf = ({text, page, distance}: ChunkDistanceRow): Match => ({
  text,
  ...(page === null ? {} : {page}),
  score: 1 - distance
});
