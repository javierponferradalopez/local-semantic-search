import {and, asc, cosineDistance, eq} from 'drizzle-orm';
import {chunks} from '../../../ingestion/infrastructure/drizzle/ChunkSchema';
import {vectors384} from '../../../ingestion/infrastructure/drizzle/Vector384Schema';
import {textResources} from '../../../resources/infrastructure/drizzle/TextResourceSchema';
import type {Vector} from '../../../shared/domain/value-objects/Vector';
import type {DrizzleConnection} from '../../../shared/infrastructure/drizzle/DrizzleConnection';
import type {Result} from '../../domain/Result';
import type {ResultReader} from '../../domain/ResultReader';

type ConstructorParams = {connection: DrizzleConnection; limit: number};

export class DrizzleResultReader implements ResultReader {
  private readonly connection: DrizzleConnection;
  private readonly limit: number;

  public constructor({connection, limit}: ConstructorParams) {
    this.connection = connection;
    this.limit = limit;
  }

  // The filter is by model and never by cut version: two cuts share one space (ADR-0010).
  public async getBestFirst(vector: Vector): Promise<Result[]> {
    const database = this.connection.database();
    const distance = cosineDistance(vectors384.vector, [...vector.value]).mapWith(Number);

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
      .where(
        and(
          eq(textResources.ingestState, 'ready'),
          eq(vectors384.modelRepository, vector.model.repository),
          eq(vectors384.modelDtype, vector.model.dtype)
        )
      )
      .orderBy(chunks.resourceId, distance)
      .as('best_matches');

    // The bare distance ascending, which is the order an index can serve.
    const rows = await database
      .select()
      .from(bestMatches)
      .orderBy(asc(bestMatches.distance))
      .limit(this.limit);

    return rows.map(({text, page, distance: rowDistance, ...resource}) => ({
      ...resource,
      bestMatch: {
        text,
        ...(page === null ? {} : {page}),
        score: 1 - rowDistance
      }
    }));
  }
}
