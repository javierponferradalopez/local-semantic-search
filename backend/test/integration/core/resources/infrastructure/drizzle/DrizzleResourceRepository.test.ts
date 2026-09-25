import {drizzle} from 'drizzle-orm/node-postgres';
import {Checksum} from '../../../../../../src/core/resources/domain/value-objects/Checksum';
import {ResourceId} from '../../../../../../src/core/resources/domain/value-objects/ResourceId';
import {DrizzleResourceRepository} from '../../../../../../src/core/resources/infrastructure/drizzle/DrizzleResourceRepository';
import {DrizzleConnection} from '../../../../../../src/core/shared/infrastructure/drizzle/DrizzleConnection';
import {testDatabase, wipeTheData} from '../../../../../lib/testInfrastructure';
import {TextResourceBuilder} from '../../../../../utils/builders/text-resource/TextResourceBuilder';

describe('DrizzleResourceRepository', () => {
  let connection: DrizzleConnection;
  let repository: DrizzleResourceRepository;

  beforeEach(async () => {
    await wipeTheData();
    connection = new DrizzleConnection({database: drizzle(testDatabase())});
    repository = new DrizzleResourceRepository({connection});
  });

  describe('#create', () => {
    it('should give back through #find what the aggregate held', async () => {
      const textResource = TextResourceBuilder.aTextResource().build();

      await repository.create(textResource);

      const stored = await repository.find(textResource.id);

      expect(stored?.toPrimitives()).toStrictEqual(textResource.toPrimitives());
    });

    it('should give back the Reason of a Failed Resource', async () => {
      const textResource = TextResourceBuilder.aTextResource()
        .withIngestState('failed')
        .withReason('unreadable_file')
        .build();

      await repository.create(textResource);

      expect((await repository.find(textResource.id))?.toPrimitives().reason).toBe(
        'unreadable_file'
      );
    });

    it('should keep no Reason key on a Resource that has none', async () => {
      const textResource = TextResourceBuilder.aTextResource().build();

      await repository.create(textResource);

      const stored = await repository.find(textResource.id);

      expect(stored?.toPrimitives()).not.toHaveProperty('reason');
    });

    it('should fail for an identifier that a Resource already holds', async () => {
      const textResource = TextResourceBuilder.aTextResource().build();
      await repository.create(textResource);

      textResource.markAsReady();

      await expect(repository.create(textResource)).rejects.toThrow();
      expect((await repository.find(textResource.id))?.toPrimitives().ingestState).toBe(
        'ingesting'
      );
    });
  });

  describe('#update', () => {
    it('should write the state that the aggregate carries', async () => {
      const textResource = TextResourceBuilder.aTextResource().build();
      await repository.create(textResource);

      textResource.markAsReady();
      await repository.update(textResource);

      expect((await repository.find(textResource.id))?.toPrimitives().ingestState).toBe(
        'ready'
      );
    });

    it('should leave no row when the Resource is gone', async () => {
      const textResource = TextResourceBuilder.aTextResource().build();
      await repository.create(textResource);
      await repository.delete(textResource);

      textResource.markAsReady();
      await repository.update(textResource);

      expect(await repository.find(textResource.id)).toBeUndefined();
    });
  });

  describe('#find', () => {
    it('should give nothing for an identifier that no Resource holds', async () => {
      expect(await repository.find(ResourceId.random())).toBeUndefined();
    });
  });

  describe('#findByChecksum', () => {
    it('should give the Resource that holds those bytes', async () => {
      const textResource = TextResourceBuilder.aTextResource().build();
      await repository.create(textResource);

      const checksum = Checksum.fromPrimitive({
        value: textResource.toPrimitives().checksum
      });

      expect((await repository.findByChecksum(checksum))?.id.value).toBe(
        textResource.id.value
      );
    });

    it('should give nothing for bytes that no Resource holds', async () => {
      const checksum = Checksum.ofBytes({bytes: Buffer.from('nothing holds these')});

      expect(await repository.findByChecksum(checksum)).toBeUndefined();
    });
  });

  describe('#delete', () => {
    it('should remove the row of the Resource', async () => {
      const textResource = TextResourceBuilder.aTextResource().build();
      await repository.create(textResource);

      await repository.delete(textResource);

      expect(await repository.find(textResource.id)).toBeUndefined();
    });
  });

  describe('the transaction of the connection', () => {
    it('should leave no row when the work throws', async () => {
      const textResource = TextResourceBuilder.aTextResource().build();

      await expect(
        connection.run(async () => {
          await repository.create(textResource);

          throw new Error('the work broke');
        })
      ).rejects.toThrow('the work broke');

      expect(await repository.find(textResource.id)).toBeUndefined();
    });
  });
});
