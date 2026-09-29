import {PictureCreatedDomainEvent} from '../../../../../src/core/ingestion/domain/events/PictureCreatedDomainEvent';
import {Picture} from '../../../../../src/core/ingestion/domain/Picture';
import {ResourceId} from '../../../../../src/core/resources/domain/value-objects/ResourceId';
import {FileKey} from '../../../../../src/core/shared/domain/value-objects/FileKey';
import {PictureBuilder} from '../../../../utils/builders/picture/PictureBuilder';

const aCreatedPicture = (resourceId: ResourceId): Picture =>
  Picture.create({
    resourceId,
    thumbnailKey: FileKey.of({value: `ingestion/thumbnails/${resourceId.value}.webp`})
  });

describe('Picture', () => {
  describe('.create', () => {
    it('should keep the identifier of its Resource and the key of its thumbnail, and nothing more', () => {
      const resourceId = ResourceId.random();

      const picture = aCreatedPicture(resourceId);

      expect(picture.toPrimitives()).toStrictEqual({
        resourceId: resourceId.value,
        thumbnailKey: `ingestion/thumbnails/${resourceId.value}.webp`
      });
    });

    it('should register PictureCreated with its Resource', () => {
      const resourceId = ResourceId.random();

      const [event] = aCreatedPicture(resourceId)
        .pullEvents()
        .filter(pulled => pulled instanceof PictureCreatedDomainEvent);

      expect(event?.aggregateId).toBe(resourceId.value);
    });
  });

  describe('.fromPrimitives', () => {
    it('should register no event, because it rebuilds a Picture that exists', () => {
      const picture = PictureBuilder.aPicture().build();

      expect(picture.pullEvents()).toEqual([]);
    });

    it('should keep the identifier of its Resource and the key of its thumbnail it was stored with', () => {
      const resourceId = ResourceId.random().value;
      const primitives = {
        resourceId,
        thumbnailKey: `ingestion/thumbnails/${resourceId}.webp`
      };

      const picture = Picture.fromPrimitives(primitives);

      expect(picture.toPrimitives()).toStrictEqual(primitives);
    });
  });
});
