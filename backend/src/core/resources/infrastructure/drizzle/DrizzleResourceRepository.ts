import {eq} from 'drizzle-orm';
import type {DrizzleConnection} from '../../../shared/infrastructure/drizzle/DrizzleConnection';
import {ImageResource} from '../../domain/ImageResource';
import type {ResourceRepository} from '../../domain/ResourceRepository';
import type {TextResource} from '../../domain/TextResource';
import type {Checksum} from '../../domain/value-objects/Checksum';
import type {ResourceId} from '../../domain/value-objects/ResourceId';
import {ImageResourceMapper} from './ImageResourceMapper';
import {imageResources} from './ImageResourceSchema';
import {TextResourceMapper} from './TextResourceMapper';
import {textResources} from './TextResourceSchema';

type ConstructorParams = {connection: DrizzleConnection};

export class DrizzleResourceRepository implements ResourceRepository {
  private readonly connection: DrizzleConnection;

  public constructor({connection}: ConstructorParams) {
    this.connection = connection;
  }

  public async find(id: ResourceId): Promise<ImageResource | TextResource | undefined> {
    const [textRow] = await this.connection
      .database()
      .select()
      .from(textResources)
      .where(eq(textResources.id, id.value))
      .limit(1);

    if (textRow !== undefined) {
      return TextResourceMapper.toDomain(textRow);
    }

    const [imageRow] = await this.connection
      .database()
      .select()
      .from(imageResources)
      .where(eq(imageResources.id, id.value))
      .limit(1);

    return imageRow === undefined ? undefined : ImageResourceMapper.toDomain(imageRow);
  }

  public async findTextResourceByChecksum(
    checksum: Checksum
  ): Promise<TextResource | undefined> {
    const [row] = await this.connection
      .database()
      .select()
      .from(textResources)
      .where(eq(textResources.checksum, checksum.value))
      .limit(1);

    return row === undefined ? undefined : TextResourceMapper.toDomain(row);
  }

  public async findImageResourceByChecksum(
    checksum: Checksum
  ): Promise<ImageResource | undefined> {
    const [row] = await this.connection
      .database()
      .select()
      .from(imageResources)
      .where(eq(imageResources.checksum, checksum.value))
      .limit(1);

    return row === undefined ? undefined : ImageResourceMapper.toDomain(row);
  }

  public async create(resource: ImageResource | TextResource): Promise<void> {
    if (resource instanceof ImageResource) {
      await this.connection
        .database()
        .insert(imageResources)
        .values(ImageResourceMapper.toRow(resource));

      return;
    }

    await this.connection
      .database()
      .insert(textResources)
      .values(TextResourceMapper.toRow(resource));
  }

  public async update(textResource: TextResource): Promise<void> {
    await this.connection
      .database()
      .update(textResources)
      .set(TextResourceMapper.toRow(textResource))
      .where(eq(textResources.id, textResource.id.value));
  }

  public async delete(resource: ImageResource | TextResource): Promise<void> {
    if (resource instanceof ImageResource) {
      await this.connection
        .database()
        .delete(imageResources)
        .where(eq(imageResources.id, resource.id.value));

      return;
    }

    await this.connection
      .database()
      .delete(textResources)
      .where(eq(textResources.id, resource.id.value));
  }
}
