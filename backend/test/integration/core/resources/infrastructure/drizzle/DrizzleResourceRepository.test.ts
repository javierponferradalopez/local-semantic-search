import {drizzle} from 'drizzle-orm/node-postgres';
import {ImageResource} from '../../../../../../src/core/resources/domain/ImageResource';
import {TextResource} from '../../../../../../src/core/resources/domain/TextResource';
import {Checksum} from '../../../../../../src/core/resources/domain/value-objects/Checksum';
import {Reason} from '../../../../../../src/core/resources/domain/value-objects/Reason';
import {ResourceId} from '../../../../../../src/core/resources/domain/value-objects/ResourceId';
import {DrizzleResourceRepository} from '../../../../../../src/core/resources/infrastructure/drizzle/DrizzleResourceRepository';
import {DrizzleConnection} from '../../../../../../src/core/shared/infrastructure/drizzle/DrizzleConnection';
import {testDatabase, wipeTheData} from '../../../../../lib/testInfrastructure';
import {ImageResourceBuilder} from '../../../../../utils/builders/image-resource/ImageResourceBuilder';
import {TextResourceBuilder} from '../../../../../utils/builders/text-resource/TextResourceBuilder';
import {StringMother} from '../../../../../utils/object-mother/StringMother';

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

    it('should give back an ImageResource through #find', async () => {
      const imageResource = ImageResourceBuilder.anImageResource()
        .withIngestState('failed')
        .withReason('image_too_large')
        .build();

      await repository.create(imageResource);

      const stored = await repository.find(imageResource.id);

      expect(stored).toBeInstanceOf(ImageResource);
      expect(stored?.toPrimitives()).toStrictEqual(imageResource.toPrimitives());
    });

    it('should keep no Reason key on an ImageResource that has none', async () => {
      const imageResource = ImageResourceBuilder.anImageResource().build();

      await repository.create(imageResource);

      expect(
        (await repository.find(imageResource.id))?.toPrimitives()
      ).not.toHaveProperty('reason');
    });

    it('should fail for the bytes that an ImageResource already holds', async () => {
      const checksum = StringMother.randomChecksum();
      await repository.create(
        ImageResourceBuilder.anImageResource().withChecksum(checksum).build()
      );

      await expect(
        repository.create(
          ImageResourceBuilder.anImageResource().withChecksum(checksum).build()
        )
      ).rejects.toThrow();
    });

    it('should keep the same bytes as a TextResource and as an ImageResource', async () => {
      const checksum = StringMother.randomChecksum();
      const textResource = TextResourceBuilder.aTextResource()
        .withChecksum(checksum)
        .build();
      const imageResource = ImageResourceBuilder.anImageResource()
        .withChecksum(checksum)
        .build();

      await repository.create(textResource);
      await repository.create(imageResource);

      expect(await repository.find(textResource.id)).toBeInstanceOf(TextResource);
      expect(await repository.find(imageResource.id)).toBeInstanceOf(ImageResource);
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

    it('should write the state that an ImageResource carries, in its own table', async () => {
      const imageResource = ImageResourceBuilder.anImageResource().build();
      await repository.create(imageResource);

      imageResource.markAsFailed({reason: Reason.of({value: 'ingest_error'})});
      await repository.update(imageResource);

      expect((await repository.find(imageResource.id))?.toPrimitives()).toMatchObject({
        ingestState: 'failed',
        reason: 'ingest_error'
      });
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

  describe('#findTextResourceByChecksum', () => {
    it('should give the TextResource that holds those bytes', async () => {
      const textResource = TextResourceBuilder.aTextResource().build();
      await repository.create(textResource);

      const checksum = Checksum.fromPrimitive({
        value: textResource.toPrimitives().checksum
      });

      expect((await repository.findTextResourceByChecksum(checksum))?.id.value).toBe(
        textResource.id.value
      );
    });

    it('should give nothing for bytes that no Resource holds', async () => {
      const checksum = Checksum.ofBytes({bytes: Buffer.from('nothing holds these')});

      expect(await repository.findTextResourceByChecksum(checksum)).toBeUndefined();
    });

    it('should give nothing for bytes that only an ImageResource holds', async () => {
      const imageResource = ImageResourceBuilder.anImageResource().build();
      await repository.create(imageResource);

      const checksum = Checksum.fromPrimitive({
        value: imageResource.toPrimitives().checksum
      });

      expect(await repository.findTextResourceByChecksum(checksum)).toBeUndefined();
    });
  });

  describe('#findImageResourceByChecksum', () => {
    it('should give the ImageResource that holds those bytes', async () => {
      const imageResource = ImageResourceBuilder.anImageResource().build();
      await repository.create(imageResource);

      const checksum = Checksum.fromPrimitive({
        value: imageResource.toPrimitives().checksum
      });
      const stored = await repository.findImageResourceByChecksum(checksum);

      expect(stored).toBeInstanceOf(ImageResource);
      expect(stored?.id.value).toBe(imageResource.id.value);
    });

    it('should give nothing for bytes that only a TextResource holds', async () => {
      const textResource = TextResourceBuilder.aTextResource().build();
      await repository.create(textResource);

      const checksum = Checksum.fromPrimitive({
        value: textResource.toPrimitives().checksum
      });

      expect(await repository.findImageResourceByChecksum(checksum)).toBeUndefined();
    });
  });

  describe('#delete', () => {
    it('should remove the row of the Resource', async () => {
      const textResource = TextResourceBuilder.aTextResource().build();
      await repository.create(textResource);

      await repository.delete(textResource);

      expect(await repository.find(textResource.id)).toBeUndefined();
    });

    it('should remove the row of an ImageResource', async () => {
      const imageResource = ImageResourceBuilder.anImageResource().build();
      await repository.create(imageResource);

      await repository.delete(imageResource);

      expect(await repository.find(imageResource.id)).toBeUndefined();
    });

    it('should leave the rows of the other Resources when it removes an ImageResource', async () => {
      const deleted = ImageResourceBuilder.anImageResource().build();
      const otherImageResource = ImageResourceBuilder.anImageResource().build();
      const textResource = TextResourceBuilder.aTextResource().build();
      await repository.create(deleted);
      await repository.create(otherImageResource);
      await repository.create(textResource);

      await repository.delete(deleted);

      expect((await repository.find(otherImageResource.id))?.id.value).toBe(
        otherImageResource.id.value
      );
      expect((await repository.find(textResource.id))?.id.value).toBe(
        textResource.id.value
      );
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
