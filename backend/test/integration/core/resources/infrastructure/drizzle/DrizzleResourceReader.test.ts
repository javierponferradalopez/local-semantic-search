import {drizzle} from 'drizzle-orm/node-postgres';
import type {ImageResource} from '../../../../../../src/core/resources/domain/ImageResource';
import type {TextResource} from '../../../../../../src/core/resources/domain/TextResource';
import {DrizzleResourceReader} from '../../../../../../src/core/resources/infrastructure/drizzle/DrizzleResourceReader';
import {DrizzleResourceRepository} from '../../../../../../src/core/resources/infrastructure/drizzle/DrizzleResourceRepository';
import {DrizzleConnection} from '../../../../../../src/core/shared/infrastructure/drizzle/DrizzleConnection';
import {testDatabase, wipeTheData} from '../../../../../lib/testInfrastructure';
import {ImageResourceBuilder} from '../../../../../utils/builders/image-resource/ImageResourceBuilder';
import {TextResourceBuilder} from '../../../../../utils/builders/text-resource/TextResourceBuilder';

describe('DrizzleResourceReader', () => {
  let repository: DrizzleResourceRepository;
  let reader: DrizzleResourceReader;

  beforeEach(async () => {
    await wipeTheData();

    const connection = new DrizzleConnection({database: drizzle(testDatabase())});

    repository = new DrizzleResourceRepository({connection});
    reader = new DrizzleResourceReader({connection});
  });

  describe('#getNewestFirst', () => {
    it('should give nothing when no Resource is stored', async () => {
      expect(await reader.getNewestFirst()).toStrictEqual([]);
    });

    it('should give the newest Resource first', async () => {
      await repository.create(aTextResourceCreatedOn('2026-09-20T10:00:00.000Z'));
      await repository.create(aTextResourceCreatedOn('2026-09-22T10:00:00.000Z'));
      await repository.create(aTextResourceCreatedOn('2026-09-21T10:00:00.000Z'));

      const listed = await reader.getNewestFirst();

      expect(listed.map(resource => resource.createdAt)).toStrictEqual([
        '2026-09-22T10:00:00.000Z',
        '2026-09-21T10:00:00.000Z',
        '2026-09-20T10:00:00.000Z'
      ]);
    });

    it('should give the ImageResources and the TextResources in one list, newest first', async () => {
      await repository.create(aTextResourceCreatedOn('2026-09-20T10:00:00.000Z'));
      await repository.create(anImageResourceCreatedOn('2026-09-23T10:00:00.000Z'));
      await repository.create(aTextResourceCreatedOn('2026-09-22T10:00:00.000Z'));
      await repository.create(anImageResourceCreatedOn('2026-09-21T10:00:00.000Z'));

      const listed = await reader.getNewestFirst();

      expect(
        listed.map(({createdAt, contentType}) => ({createdAt, contentType}))
      ).toStrictEqual([
        {createdAt: '2026-09-23T10:00:00.000Z', contentType: 'png'},
        {createdAt: '2026-09-22T10:00:00.000Z', contentType: 'markdown'},
        {createdAt: '2026-09-21T10:00:00.000Z', contentType: 'png'},
        {createdAt: '2026-09-20T10:00:00.000Z', contentType: 'markdown'}
      ]);
    });

    it('should give the same fields for an ImageResource as for a TextResource', async () => {
      const imageResource = ImageResourceBuilder.anImageResource()
        .withIngestState('failed')
        .withReason('image_too_large')
        .build();
      await repository.create(imageResource);

      const [listed] = await reader.getNewestFirst();
      const primitives = imageResource.toPrimitives();

      expect(listed).toStrictEqual({
        id: primitives.id,
        name: primitives.name,
        contentType: primitives.contentType,
        ingestState: primitives.ingestState,
        reason: 'image_too_large',
        createdAt: primitives.createdAt,
        fileKey: primitives.fileKey
      });
    });

    it('should give the fields the list paints, and no Checksum', async () => {
      const textResource = aTextResourceCreatedOn('2026-09-22T10:00:00.000Z');
      await repository.create(textResource);

      const [listed] = await reader.getNewestFirst();
      const primitives = textResource.toPrimitives();

      expect(listed).toStrictEqual({
        id: primitives.id,
        name: primitives.name,
        contentType: primitives.contentType,
        ingestState: primitives.ingestState,
        createdAt: primitives.createdAt,
        fileKey: primitives.fileKey
      });
    });

    it('should carry the Reason of a Failed Resource', async () => {
      await repository.create(
        TextResourceBuilder.aTextResource()
          .withIngestState('failed')
          .withReason('no_text_found')
          .build()
      );

      const [listed] = await reader.getNewestFirst();

      expect(listed?.reason).toBe('no_text_found');
    });
  });
});

const aTextResourceCreatedOn = (createdAt: string): TextResource =>
  TextResourceBuilder.aTextResource().withCreatedAt(createdAt).build();

const anImageResourceCreatedOn = (createdAt: string): ImageResource =>
  ImageResourceBuilder.anImageResource().withCreatedAt(createdAt).build();
