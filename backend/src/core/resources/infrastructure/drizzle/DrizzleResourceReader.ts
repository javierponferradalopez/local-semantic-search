import {desc} from 'drizzle-orm';
import type {DrizzleConnection} from '../../../shared/infrastructure/drizzle/DrizzleConnection';
import type {ListedResource} from '../../domain/ListedResource';
import type {ResourceReader} from '../../domain/ResourceReader';
import {textResources} from './TextResourceSchema';

type ConstructorParams = {connection: DrizzleConnection};

export class DrizzleResourceReader implements ResourceReader {
  private readonly connection: DrizzleConnection;

  public constructor({connection}: ConstructorParams) {
    this.connection = connection;
  }

  public async getNewestFirst(): Promise<ListedResource[]> {
    const rows = await this.connection
      .database()
      .select({
        id: textResources.id,
        name: textResources.name,
        contentType: textResources.contentType,
        ingestState: textResources.ingestState,
        reason: textResources.reason,
        createdAt: textResources.createdAt,
        fileKey: textResources.fileKey
      })
      .from(textResources)
      .orderBy(desc(textResources.createdAt));

    return rows.map(({reason, createdAt, ...row}) => {
      const listed: ListedResource = {...row, createdAt: createdAt.toISOString()};

      return reason === null ? listed : {...listed, reason};
    });
  }
}
