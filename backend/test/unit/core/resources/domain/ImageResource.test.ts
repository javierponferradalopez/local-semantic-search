import {INGEST_STATES} from 'contract/IngestState';
import {IngestStateError} from '../../../../../src/core/resources/domain/errors/IngestStateError';
import {ResourceNotFailedError} from '../../../../../src/core/resources/domain/errors/ResourceNotFailedError';
import {ImageResourceCreatedDomainEvent} from '../../../../../src/core/resources/domain/events/ImageResourceCreatedDomainEvent';
import {ImageResourceDeletedDomainEvent} from '../../../../../src/core/resources/domain/events/ImageResourceDeletedDomainEvent';
import {ImageResourceRetriedDomainEvent} from '../../../../../src/core/resources/domain/events/ImageResourceRetriedDomainEvent';
import {ImageResource} from '../../../../../src/core/resources/domain/ImageResource';
import {Checksum} from '../../../../../src/core/resources/domain/value-objects/Checksum';
import {ContentType} from '../../../../../src/core/resources/domain/value-objects/ContentType';
import {CreatedAt} from '../../../../../src/core/resources/domain/value-objects/CreatedAt';
import {Reason} from '../../../../../src/core/resources/domain/value-objects/Reason';
import {ResourceId} from '../../../../../src/core/resources/domain/value-objects/ResourceId';
import {ResourceName} from '../../../../../src/core/resources/domain/value-objects/ResourceName';
import {FileKey} from '../../../../../src/core/shared/domain/value-objects/FileKey';
import {ImageResourceBuilder} from '../../../../utils/builders/image-resource/ImageResourceBuilder';
import {StringMother} from '../../../../utils/object-mother/StringMother';

const aCreatedImageResource = (): ImageResource => {
  const id = ResourceId.random();
  const name = ResourceName.of({value: StringMother.randomFileName('.pdf')});

  return ImageResource.create({
    id,
    name,
    contentType: ContentType.of({value: 'pdf'}),
    fileKey: FileKey.of({value: `resources/${id.value}/${name.value}`}),
    checksum: Checksum.of({value: StringMother.randomChecksum()}),
    createdAt: CreatedAt.of({value: new Date()})
  });
};

describe('ImageResource', () => {
  describe('.create', () => {
    it('should give a Resource that is Ingesting and keeps no Reason', () => {
      const imageResource = aCreatedImageResource();

      expect(imageResource.toPrimitives().ingestState).toBe('ingesting');
      expect(imageResource.toPrimitives().reason).toBeUndefined();
    });

    it('should register ImageResourceCreatedDomainEvent', () => {
      const imageResource = aCreatedImageResource();

      const [event] = imageResource.pullEvents();

      expect(event).toBeInstanceOf(ImageResourceCreatedDomainEvent);
      expect(event?.aggregateId).toBe(imageResource.id.value);
    });

    it('should carry the Content type and the key of the File in ImageResourceCreatedDomainEvent', () => {
      const imageResource = aCreatedImageResource();

      const [event] = imageResource
        .pullEvents()
        .filter(pulled => pulled instanceof ImageResourceCreatedDomainEvent);

      expect(event?.contentType).toBe('pdf');
      expect(event?.fileKey).toBe(imageResource.fileKey.value);
    });

    it('should name ImageResourceCreatedDomainEvent resources.image_resource.created', () => {
      const [event] = aCreatedImageResource().pullEvents();

      expect(event?.eventName).toBe('resources.image_resource.created');
    });

    it('should register ImageResourceCreatedDomainEvent once and nothing else', () => {
      const imageResource = aCreatedImageResource();

      expect(imageResource.pullEvents()).toHaveLength(1);
    });
  });

  describe('#markAsReady', () => {
    it('should take an Ingesting Resource to Ready', () => {
      const imageResource = ImageResourceBuilder.anImageResource()
        .withIngestState('ingesting')
        .build();

      imageResource.markAsReady();

      expect(imageResource.toPrimitives().ingestState).toBe('ready');
    });

    it('should register no event', () => {
      const imageResource = ImageResourceBuilder.anImageResource()
        .withIngestState('ingesting')
        .build();

      imageResource.markAsReady();

      expect(imageResource.pullEvents()).toStrictEqual([]);
    });

    it('should refuse a Resource that is Ready', () => {
      const imageResource = ImageResourceBuilder.anImageResource()
        .withIngestState('ready')
        .build();

      expect(() => imageResource.markAsReady()).toThrow(IngestStateError);
    });

    it('should refuse a Resource that is Failed', () => {
      const imageResource = ImageResourceBuilder.anImageResource()
        .withIngestState('failed')
        .withReason('ingest_error')
        .build();

      expect(() => imageResource.markAsReady()).toThrow(IngestStateError);
    });
  });

  describe('#markAsFailed', () => {
    it('should take an Ingesting Resource to Failed and keep its Reason', () => {
      const imageResource = ImageResourceBuilder.anImageResource()
        .withIngestState('ingesting')
        .build();

      imageResource.markAsFailed({reason: Reason.of({value: 'no_text_found'})});

      expect(imageResource.toPrimitives().ingestState).toBe('failed');
      expect(imageResource.toPrimitives().reason).toBe('no_text_found');
    });

    it('should register no event', () => {
      const imageResource = ImageResourceBuilder.anImageResource()
        .withIngestState('ingesting')
        .build();

      imageResource.markAsFailed({reason: Reason.of({value: 'no_text_found'})});

      expect(imageResource.pullEvents()).toStrictEqual([]);
    });

    it('should refuse a Resource that is Ready', () => {
      const imageResource = ImageResourceBuilder.anImageResource()
        .withIngestState('ready')
        .build();

      expect(() =>
        imageResource.markAsFailed({reason: Reason.of({value: 'ingest_error'})})
      ).toThrow(IngestStateError);
    });

    it('should refuse a Resource that is Failed', () => {
      const imageResource = ImageResourceBuilder.anImageResource()
        .withIngestState('failed')
        .withReason('unreadable_file')
        .build();

      expect(() =>
        imageResource.markAsFailed({reason: Reason.of({value: 'ingest_error'})})
      ).toThrow(IngestStateError);
    });
  });

  describe('#retry', () => {
    it('should take a Failed Resource to Ingesting and drop its Reason', () => {
      const imageResource = ImageResourceBuilder.anImageResource()
        .withIngestState('failed')
        .withReason('unreadable_file')
        .build();

      imageResource.retry();

      expect(imageResource.toPrimitives().ingestState).toBe('ingesting');
      expect(imageResource.toPrimitives().reason).toBeUndefined();
    });

    it('should register ImageResourceRetriedDomainEvent', () => {
      const imageResource = ImageResourceBuilder.anImageResource()
        .withIngestState('failed')
        .withReason('ingest_error')
        .build();

      imageResource.retry();

      const [event] = imageResource.pullEvents();

      expect(event).toBeInstanceOf(ImageResourceRetriedDomainEvent);
      expect(event?.aggregateId).toBe(imageResource.id.value);
    });

    it('should carry the Content type and the key of the File in ImageResourceRetriedDomainEvent', () => {
      const imageResource = ImageResourceBuilder.anImageResource()
        .withIngestState('failed')
        .withReason('ingest_error')
        .build();

      imageResource.retry();

      const [event] = imageResource
        .pullEvents()
        .filter(pulled => pulled instanceof ImageResourceRetriedDomainEvent);

      expect(event?.contentType).toBe('pdf');
      expect(event?.fileKey).toBe(imageResource.fileKey.value);
    });

    it('should name ImageResourceRetriedDomainEvent resources.image_resource.retried', () => {
      const imageResource = ImageResourceBuilder.anImageResource()
        .withIngestState('failed')
        .withReason('ingest_error')
        .build();

      imageResource.retry();

      const [event] = imageResource.pullEvents();

      expect(event?.eventName).toBe('resources.image_resource.retried');
    });

    it('should refuse a Resource that is Ingesting', () => {
      const imageResource = ImageResourceBuilder.anImageResource()
        .withIngestState('ingesting')
        .build();

      expect(() => imageResource.retry()).toThrow(ResourceNotFailedError);
    });

    it('should refuse a Resource that is Ready', () => {
      const imageResource = ImageResourceBuilder.anImageResource()
        .withIngestState('ready')
        .build();

      expect(() => imageResource.retry()).toThrow(ResourceNotFailedError);
    });
  });

  describe('#delete', () => {
    it.each([...INGEST_STATES])(
      'should register ImageResourceDeletedDomainEvent from %s',
      state => {
        const imageResource = ImageResourceBuilder.anImageResource()
          .withIngestState(state)
          .build();

        imageResource.delete();

        const [event] = imageResource.pullEvents();

        expect(event).toBeInstanceOf(ImageResourceDeletedDomainEvent);
        expect(event?.aggregateId).toBe(imageResource.id.value);
      }
    );

    it('should name ImageResourceDeletedDomainEvent resources.image_resource.deleted', () => {
      const imageResource = ImageResourceBuilder.anImageResource().build();

      imageResource.delete();

      const [event] = imageResource.pullEvents();

      expect(event?.eventName).toBe('resources.image_resource.deleted');
    });
  });

  describe('#pullEvents', () => {
    it('should give the events it registered once', () => {
      const imageResource = aCreatedImageResource();

      imageResource.pullEvents();

      expect(imageResource.pullEvents()).toStrictEqual([]);
    });

    it('should give nothing from a Resource that registered no event', () => {
      const imageResource = ImageResourceBuilder.anImageResource().build();

      expect(imageResource.pullEvents()).toStrictEqual([]);
    });
  });

  describe('#toPrimitives', () => {
    it('should give back what .fromPrimitives read, Reason and all', () => {
      const primitives = {
        id: StringMother.randomUuid(),
        name: 'the scan.pdf',
        contentType: 'pdf',
        fileKey: 'resources/the scan.pdf',
        checksum: StringMother.randomChecksum(),
        createdAt: '2026-09-22T10:00:00.000Z',
        ingestState: 'failed',
        reason: 'unreadable_file'
      } as const;

      expect(ImageResource.fromPrimitives(primitives).toPrimitives()).toStrictEqual(
        primitives
      );
    });

    it('should keep no Reason key on a Resource that has none', () => {
      const imageResource = ImageResourceBuilder.anImageResource()
        .withIngestState('ready')
        .build();

      expect(imageResource.toPrimitives()).not.toHaveProperty('reason');
    });
  });

  describe('the whole life of a Resource', () => {
    it('should go from Ingesting to Failed, back to Ingesting, and on to Ready', () => {
      const imageResource = aCreatedImageResource();

      imageResource.markAsFailed({reason: Reason.of({value: 'ingest_error'})});
      imageResource.retry();
      imageResource.markAsReady();

      expect(imageResource.toPrimitives().ingestState).toBe('ready');
      expect(imageResource.toPrimitives().reason).toBeUndefined();
    });
  });
});
