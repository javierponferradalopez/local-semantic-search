import {and, asc, cosineDistance, eq} from 'drizzle-orm';
import {pictures} from '../../../ingestion/infrastructure/drizzle/PictureSchema';
import {pictureVectors768} from '../../../ingestion/infrastructure/drizzle/PictureVector768Schema';
import {imageResources} from '../../../resources/infrastructure/drizzle/ImageResourceSchema';
import type {Vector} from '../../../shared/domain/value-objects/Vector';
import type {DrizzleConnection} from '../../../shared/infrastructure/drizzle/DrizzleConnection';
import type {PictureResult} from '../../domain/PictureResult';
import type {PictureResultReader} from '../../domain/PictureResultReader';

type ConstructorParams = {
  connection: DrizzleConnection;
  resultsLimit: number;
};

export class DrizzlePictureResultReader implements PictureResultReader {
  private readonly connection: DrizzleConnection;
  private readonly resultsLimit: number;

  public constructor({connection, resultsLimit}: ConstructorParams) {
    this.connection = connection;
    this.resultsLimit = resultsLimit;
  }

  public async getBestFirst(vector: Vector): Promise<PictureResult[]> {
    const database = this.connection.database();
    const distance = cosineDistance(pictureVectors768.vector, [...vector.value]).mapWith(
      Number
    );

    // DISTINCT ON keeps the best Picture of each Resource, so the limit counts Results (ADR-0002).
    const bestMatches = database
      .selectDistinctOn([pictures.resourceId], {
        resourceId: pictures.resourceId,
        name: imageResources.name,
        fileKey: imageResources.fileKey,
        thumbnailKey: pictures.thumbnailKey,
        distance: distance.as('distance')
      })
      .from(pictures)
      .innerJoin(pictureVectors768, eq(pictureVectors768.pictureId, pictures.id))
      // The INNER JOIN also drops an orphan Picture, which has no Resource to join (ADR-0020).
      .innerJoin(imageResources, eq(imageResources.id, pictures.resourceId))
      .where(
        and(
          eq(imageResources.ingestState, 'ready'),
          eq(pictureVectors768.modelRepository, vector.model.repository),
          eq(pictureVectors768.modelDtype, vector.model.dtype)
        )
      )
      // A Resource has one Picture: the id makes the order total, as in the text Search.
      .orderBy(pictures.resourceId, distance, pictures.id)
      .as('best_matches');

    const rows = await database
      .select()
      .from(bestMatches)
      .orderBy(asc(bestMatches.distance), asc(bestMatches.resourceId))
      .limit(this.resultsLimit);

    return rows.map(({distance: rowDistance, ...resource}) => ({
      ...resource,
      bestMatch: {score: 1 - rowDistance}
    }));
  }
}
