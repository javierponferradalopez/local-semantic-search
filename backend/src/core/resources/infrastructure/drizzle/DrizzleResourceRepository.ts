import {eq} from 'drizzle-orm';
import type {DrizzleConnection} from '../../../shared/infrastructure/drizzle/DrizzleConnection';
import type {ResourceRepository} from '../../domain/ResourceRepository';
import type {TextResource} from '../../domain/TextResource';
import type {Checksum} from '../../domain/value-objects/Checksum';
import type {ResourceId} from '../../domain/value-objects/ResourceId';
import {TextResourceMapper} from './TextResourceMapper';
import {textResources} from './TextResourceSchema';

type ConstructorParams = {connection: DrizzleConnection};

export class DrizzleResourceRepository implements ResourceRepository {
  private readonly connection: DrizzleConnection;

  public constructor({connection}: ConstructorParams) {
    this.connection = connection;
  }

  public async find(id: ResourceId): Promise<TextResource | undefined> {
    const [row] = await this.connection
      .database()
      .select()
      .from(textResources)
      .where(eq(textResources.id, id.value))
      .limit(1);

    return row === undefined ? undefined : TextResourceMapper.toDomain(row);
  }

  public async findByChecksum(checksum: Checksum): Promise<TextResource | undefined> {
    const [row] = await this.connection
      .database()
      .select()
      .from(textResources)
      .where(eq(textResources.checksum, checksum.value))
      .limit(1);

    return row === undefined ? undefined : TextResourceMapper.toDomain(row);
  }

  public async save(textResource: TextResource): Promise<void> {
    const row = TextResourceMapper.toRow(textResource);

    await this.connection
      .database()
      .insert(textResources)
      .values(row)
      .onConflictDoUpdate({target: textResources.id, set: row});
  }

  public async delete(textResource: TextResource): Promise<void> {
    await this.connection
      .database()
      .delete(textResources)
      .where(eq(textResources.id, textResource.id.value));
  }
}
