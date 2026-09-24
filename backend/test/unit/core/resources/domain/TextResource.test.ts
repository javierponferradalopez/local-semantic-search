import {INGEST_STATES} from 'contract/IngestState';
import {IngestStateError} from '../../../../../src/core/resources/domain/errors/IngestStateError';
import {ResourceNotFailedError} from '../../../../../src/core/resources/domain/errors/ResourceNotFailedError';
import {TextResourceCreatedDomainEvent} from '../../../../../src/core/resources/domain/events/TextResourceCreatedDomainEvent';
import {TextResourceDeletedDomainEvent} from '../../../../../src/core/resources/domain/events/TextResourceDeletedDomainEvent';
import {TextResourceRetriedDomainEvent} from '../../../../../src/core/resources/domain/events/TextResourceRetriedDomainEvent';
import {TextResource} from '../../../../../src/core/resources/domain/TextResource';
import {Checksum} from '../../../../../src/core/resources/domain/value-objects/Checksum';
import {ContentType} from '../../../../../src/core/resources/domain/value-objects/ContentType';
import {CreatedAt} from '../../../../../src/core/resources/domain/value-objects/CreatedAt';
import {Reason} from '../../../../../src/core/resources/domain/value-objects/Reason';
import {ResourceId} from '../../../../../src/core/resources/domain/value-objects/ResourceId';
import {ResourceName} from '../../../../../src/core/resources/domain/value-objects/ResourceName';
import {FileKey} from '../../../../../src/core/shared/domain/value-objects/FileKey';
import {TextResourceBuilder} from '../../../../utils/builders/text-resource/TextResourceBuilder';
import {StringMother} from '../../../../utils/object-mother/StringMother';

const aCreatedTextResource = (): TextResource => {
  const id = ResourceId.random();
  const name = ResourceName.of({value: StringMother.randomFileName('.md')});

  return TextResource.create({
    id,
    name,
    contentType: ContentType.of({value: 'markdown'}),
    fileKey: FileKey.of({value: `resources/${id.value}/${name.value}`}),
    checksum: Checksum.of({value: StringMother.randomChecksum()}),
    createdAt: CreatedAt.of({value: new Date()})
  });
};

describe('TextResource', () => {
  describe('.create', () => {
    it('should give a Resource that is Ingesting and keeps no Reason', () => {
      const textResource = aCreatedTextResource();

      expect(textResource.toPrimitives().ingestState).toBe('ingesting');
      expect(textResource.toPrimitives().reason).toBeUndefined();
    });

    it('should register TextResourceCreatedDomainEvent', () => {
      const textResource = aCreatedTextResource();

      const [event] = textResource.pullEvents();

      expect(event).toBeInstanceOf(TextResourceCreatedDomainEvent);
      expect(event?.aggregateId).toBe(textResource.id.value);
    });

    it('should carry the Content type and the key of the File in TextResourceCreatedDomainEvent', () => {
      const textResource = aCreatedTextResource();

      const [event] = textResource
        .pullEvents()
        .filter(pulled => pulled instanceof TextResourceCreatedDomainEvent);

      expect(event?.contentType).toBe('markdown');
      expect(event?.fileKey).toBe(textResource.fileKey.value);
    });

    it('should register TextResourceCreatedDomainEvent once and nothing else', () => {
      const textResource = aCreatedTextResource();

      expect(textResource.pullEvents()).toHaveLength(1);
    });
  });

  describe('#markAsReady', () => {
    it('should take an Ingesting Resource to Ready', () => {
      const textResource = TextResourceBuilder.aTextResource()
        .withIngestState('ingesting')
        .build();

      textResource.markAsReady();

      expect(textResource.toPrimitives().ingestState).toBe('ready');
    });

    it('should register no event', () => {
      const textResource = TextResourceBuilder.aTextResource()
        .withIngestState('ingesting')
        .build();

      textResource.markAsReady();

      expect(textResource.pullEvents()).toStrictEqual([]);
    });

    it('should refuse a Resource that is Ready', () => {
      const textResource = TextResourceBuilder.aTextResource()
        .withIngestState('ready')
        .build();

      expect(() => textResource.markAsReady()).toThrow(IngestStateError);
    });

    it('should refuse a Resource that is Failed', () => {
      const textResource = TextResourceBuilder.aTextResource()
        .withIngestState('failed')
        .withReason('ingest_error')
        .build();

      expect(() => textResource.markAsReady()).toThrow(IngestStateError);
    });
  });

  describe('#markAsFailed', () => {
    it('should take an Ingesting Resource to Failed and keep its Reason', () => {
      const textResource = TextResourceBuilder.aTextResource()
        .withIngestState('ingesting')
        .build();

      textResource.markAsFailed({reason: Reason.of({value: 'no_text_found'})});

      expect(textResource.toPrimitives().ingestState).toBe('failed');
      expect(textResource.toPrimitives().reason).toBe('no_text_found');
    });

    it('should register no event', () => {
      const textResource = TextResourceBuilder.aTextResource()
        .withIngestState('ingesting')
        .build();

      textResource.markAsFailed({reason: Reason.of({value: 'no_text_found'})});

      expect(textResource.pullEvents()).toStrictEqual([]);
    });

    it('should refuse a Resource that is Ready', () => {
      const textResource = TextResourceBuilder.aTextResource()
        .withIngestState('ready')
        .build();

      expect(() =>
        textResource.markAsFailed({reason: Reason.of({value: 'ingest_error'})})
      ).toThrow(IngestStateError);
    });

    it('should refuse a Resource that is Failed', () => {
      const textResource = TextResourceBuilder.aTextResource()
        .withIngestState('failed')
        .withReason('unreadable_file')
        .build();

      expect(() =>
        textResource.markAsFailed({reason: Reason.of({value: 'ingest_error'})})
      ).toThrow(IngestStateError);
    });
  });

  describe('#retry', () => {
    it('should take a Failed Resource to Ingesting and drop its Reason', () => {
      const textResource = TextResourceBuilder.aTextResource()
        .withIngestState('failed')
        .withReason('unreadable_file')
        .build();

      textResource.retry();

      expect(textResource.toPrimitives().ingestState).toBe('ingesting');
      expect(textResource.toPrimitives().reason).toBeUndefined();
    });

    it('should register TextResourceRetriedDomainEvent', () => {
      const textResource = TextResourceBuilder.aTextResource()
        .withIngestState('failed')
        .withReason('ingest_error')
        .build();

      textResource.retry();

      const [event] = textResource.pullEvents();

      expect(event).toBeInstanceOf(TextResourceRetriedDomainEvent);
      expect(event?.aggregateId).toBe(textResource.id.value);
    });

    it('should carry the Content type and the key of the File in TextResourceRetriedDomainEvent', () => {
      const textResource = TextResourceBuilder.aTextResource()
        .withIngestState('failed')
        .withReason('ingest_error')
        .build();

      textResource.retry();

      const [event] = textResource
        .pullEvents()
        .filter(pulled => pulled instanceof TextResourceRetriedDomainEvent);

      expect(event?.contentType).toBe('markdown');
      expect(event?.fileKey).toBe(textResource.fileKey.value);
    });

    it('should refuse a Resource that is Ingesting', () => {
      const textResource = TextResourceBuilder.aTextResource()
        .withIngestState('ingesting')
        .build();

      expect(() => textResource.retry()).toThrow(ResourceNotFailedError);
    });

    it('should refuse a Resource that is Ready', () => {
      const textResource = TextResourceBuilder.aTextResource()
        .withIngestState('ready')
        .build();

      expect(() => textResource.retry()).toThrow(ResourceNotFailedError);
    });
  });

  describe('#delete', () => {
    it.each([...INGEST_STATES])(
      'should register TextResourceDeletedDomainEvent from %s',
      state => {
        const textResource = TextResourceBuilder.aTextResource()
          .withIngestState(state)
          .build();

        textResource.delete();

        const [event] = textResource.pullEvents();

        expect(event).toBeInstanceOf(TextResourceDeletedDomainEvent);
        expect(event?.aggregateId).toBe(textResource.id.value);
      }
    );
  });

  describe('#pullEvents', () => {
    it('should give the events it registered once', () => {
      const textResource = aCreatedTextResource();

      textResource.pullEvents();

      expect(textResource.pullEvents()).toStrictEqual([]);
    });

    it('should give nothing from a Resource that registered no event', () => {
      const textResource = TextResourceBuilder.aTextResource().build();

      expect(textResource.pullEvents()).toStrictEqual([]);
    });
  });

  describe('#toPrimitives', () => {
    it('should give back what .fromPrimitives read, Reason and all', () => {
      const primitives = {
        id: StringMother.randomUuid(),
        name: 'the notes.md',
        contentType: 'markdown',
        fileKey: 'resources/the notes.md',
        checksum: StringMother.randomChecksum(),
        createdAt: '2026-09-22T10:00:00.000Z',
        ingestState: 'failed',
        reason: 'unreadable_file'
      } as const;

      expect(TextResource.fromPrimitives(primitives).toPrimitives()).toStrictEqual(
        primitives
      );
    });

    it('should keep no Reason key on a Resource that has none', () => {
      const textResource = TextResourceBuilder.aTextResource()
        .withIngestState('ready')
        .build();

      expect(textResource.toPrimitives()).not.toHaveProperty('reason');
    });
  });

  describe('the whole life of a Resource', () => {
    it('should go from Ingesting to Failed, back to Ingesting, and on to Ready', () => {
      const textResource = aCreatedTextResource();

      textResource.markAsFailed({reason: Reason.of({value: 'ingest_error'})});
      textResource.retry();
      textResource.markAsReady();

      expect(textResource.toPrimitives().ingestState).toBe('ready');
      expect(textResource.toPrimitives().reason).toBeUndefined();
    });
  });
});
