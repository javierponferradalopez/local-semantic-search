import type {ContentType} from 'contract/ContentType';
import {desc, sql} from 'drizzle-orm';
import type {DrizzleConnection} from '../../../shared/infrastructure/drizzle/DrizzleConnection';
import type {ListedResource} from '../../domain/ListedResource';
import type {ResourceReader} from '../../domain/ResourceReader';
import {imageResources} from './ImageResourceSchema';
import {textResources} from './TextResourceSchema';

type ConstructorParams = {connection: DrizzleConnection};

export class DrizzleResourceReader implements ResourceReader {
  private readonly connection: DrizzleConnection;

  public constructor({connection}: ConstructorParams) {
    this.connection = connection;
  }

  public async getNewestFirst(): Promise<ListedResource[]> {
    const database = this.connection.database();
    // Each table narrows its Content type, and the two halves of a UNION ALL must give one type.
    const rows = await database
      .select({
        id: textResources.id,
        name: textResources.name,
        contentType: sql<ContentType>`${textResources.contentType}`,
        ingestState: textResources.ingestState,
        reason: textResources.reason,
        createdAt: textResources.createdAt,
        fileKey: textResources.fileKey
      })
      .from(textResources)
      .unionAll(
        database
          .select({
            id: imageResources.id,
            name: imageResources.name,
            contentType: sql<ContentType>`${imageResources.contentType}`,
            ingestState: imageResources.ingestState,
            reason: imageResources.reason,
            createdAt: imageResources.createdAt,
            fileKey: imageResources.fileKey
          })
          .from(imageResources)
      )
      .orderBy(({createdAt}) => desc(createdAt));

    return rows.map(({reason, createdAt, ...row}) => {
      const listed: ListedResource = {...row, createdAt: createdAt.toISOString()};

      return reason === null ? listed : {...listed, reason};
    });
  }
}
