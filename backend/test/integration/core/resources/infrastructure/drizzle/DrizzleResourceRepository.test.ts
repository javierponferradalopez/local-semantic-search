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

  describe('#save', () => {
    it('should give back through #find what the aggregate held', async () => {
      const textResource = TextResourceBuilder.aTextResource().build();

      await repository.save(textResource);

      const stored = await repository.find(textResource.id);

      expect(stored?.toPrimitives()).toStrictEqual(textResource.toPrimitives());
    });

    it('should give back the Reason of a Failed Resource', async () => {
      const textResource = TextResourceBuilder.aTextResource()
        .withIngestState('failed')
        .withReason('unreadable_file')
        .build();

      await repository.save(textResource);

      expect((await repository.find(textResource.id))?.toPrimitives().reason).toBe(
        'unreadable_file'
      );
    });

    it('should keep no Reason key on a Resource that has none', async () => {
      const textResource = TextResourceBuilder.aTextResource().build();

      await repository.save(textResource);

      const stored = await repository.find(textResource.id);

      expect(stored?.toPrimitives()).not.toHaveProperty('reason');
    });

    it('should write the state a second save carries', async () => {
      const textResource = TextResourceBuilder.aTextResource().build();
      await repository.save(textResource);

      textResource.markAsReady();
      await repository.save(textResource);

      expect((await repository.find(textResource.id))?.toPrimitives().ingestState).toBe(
        'ready'
      );
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
      await repository.save(textResource);

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
      await repository.save(textResource);

      await repository.delete(textResource);

      expect(await repository.find(textResource.id)).toBeUndefined();
    });
  });

  describe('the transaction of the connection', () => {
    it('should leave no row when the work throws', async () => {
      const textResource = TextResourceBuilder.aTextResource().build();

      await expect(
        connection.run(async () => {
          await repository.save(textResource);

          throw new Error('the work broke');
        })
      ).rejects.toThrow('the work broke');

      expect(await repository.find(textResource.id)).toBeUndefined();
    });
  });
});
