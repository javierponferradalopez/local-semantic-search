import {randomUUID} from 'node:crypto';
import {eq, inArray} from 'drizzle-orm';
import type {ResourceId} from '../../../resources/domain/value-objects/ResourceId';
import type {DrizzleConnection} from '../../../shared/infrastructure/drizzle/DrizzleConnection';
import type {EmbeddedPicture, PictureRepository} from '../../domain/PictureRepository';
import {PictureMapper} from './PictureMapper';
import {pictures} from './PictureSchema';
import {pictureVectors768} from './PictureVector768Schema';

type ConstructorParams = {connection: DrizzleConnection};

export class DrizzlePictureRepository implements PictureRepository {
  private readonly connection: DrizzleConnection;

  public constructor({connection}: ConstructorParams) {
    this.connection = connection;
  }

  // A transaction of its own, or a savepoint inside the one that is open.
  public async create(embeddedPicture: EmbeddedPicture): Promise<void> {
    const rows = PictureMapper.toRows(embeddedPicture, randomUUID());

    await this.connection.database().transaction(async transaction => {
      await transaction.insert(pictures).values(rows.picture);
      await transaction.insert(pictureVectors768).values(rows.vector);
    });
  }

  public async deleteManyByResourceId(resourceId: ResourceId): Promise<void> {
    await this.connection.database().transaction(async transaction => {
      const picturesOfTheResource = transaction
        .select({id: pictures.id})
        .from(pictures)
        .where(eq(pictures.resourceId, resourceId.value));

      await transaction
        .delete(pictureVectors768)
        .where(inArray(pictureVectors768.pictureId, picturesOfTheResource));
      await transaction.delete(pictures).where(eq(pictures.resourceId, resourceId.value));
    });
  }
}
