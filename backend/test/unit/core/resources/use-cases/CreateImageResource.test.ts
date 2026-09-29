import {DuplicateResourceError} from '../../../../../src/core/resources/domain/errors/DuplicateResourceError';
import {UnsupportedContentTypeError} from '../../../../../src/core/resources/domain/errors/UnsupportedContentTypeError';
import {ImageResourceCreatedDomainEvent} from '../../../../../src/core/resources/domain/events/ImageResourceCreatedDomainEvent';
import type {ResourceRepository} from '../../../../../src/core/resources/domain/ResourceRepository';
import type {ContentTypeResolver} from '../../../../../src/core/resources/domain/services/ContentTypeResolver';
import {ImageContentType} from '../../../../../src/core/resources/domain/value-objects/ImageContentType';
import {CreateImageResource} from '../../../../../src/core/resources/use-cases/CreateImageResource';
import {ValueObjectError} from '../../../../../src/core/shared/domain/errors/ValueObjectError';
import type {EventBus} from '../../../../../src/core/shared/domain/services/EventBus';
import type {FileStore} from '../../../../../src/core/shared/domain/services/FileStore';
import type {TransactionRunner} from '../../../../../src/core/shared/domain/services/TransactionRunner';
import {ImageResourceBuilder} from '../../../../utils/builders/image-resource/ImageResourceBuilder';
import {type MockProxy, mock} from '../../../../utils/mock';
import {StringMother} from '../../../../utils/object-mother/StringMother';

const A_FILE_URL = '/files/resources/the-beach.png';

describe('CreateImageResource', () => {
  let resourceRepository: MockProxy<ResourceRepository>;
  let fileStore: MockProxy<FileStore>;
  let eventBus: MockProxy<EventBus>;
  let transactionRunner: MockProxy<TransactionRunner>;
  let contentTypeResolver: MockProxy<ContentTypeResolver>;
  let createImageResource: CreateImageResource;
  let steps: string[];

  beforeEach(() => {
    steps = [];
    resourceRepository = mock<ResourceRepository>();
    fileStore = mock<FileStore>();
    eventBus = mock<EventBus>();
    transactionRunner = mock<TransactionRunner>();
    contentTypeResolver = mock<ContentTypeResolver>();

    resourceRepository.findImageResourceByChecksum.mockResolvedValue(undefined);
    resourceRepository.create.mockImplementation(async () => {
      steps.push('create');
    });
    fileStore.store.mockImplementation(async () => {
      steps.push('store');
    });
    fileStore.urlOf.mockReturnValue(A_FILE_URL);
    eventBus.publish.mockImplementation(async () => {
      steps.push('publish');
    });
    transactionRunner.run.mockImplementation(async work => {
      const result = await work();
      steps.push('commit');

      return result;
    });
    contentTypeResolver.resolveImage.mockReturnValue(ImageContentType.of({value: 'png'}));

    createImageResource = new CreateImageResource({
      resourceRepository,
      fileStore,
      eventBus,
      transactionRunner,
      contentTypeResolver
    });
  });

  describe('#run', () => {
    it('should give the row of a Resource that is Ingesting', async () => {
      const row = await createImageResource.run({
        name: 'the beach.png',
        bytes: someBytes()
      });

      expect(row.name).toBe('the beach.png');
      expect(row.contentType).toBe('png');
      expect(row.ingestState).toBe('ingesting');
      expect(row.fileUrl).toBe(A_FILE_URL);
      expect(row).not.toHaveProperty('reason');
    });

    it('should store the File under the key of the Resource', async () => {
      const bytes = someBytes();

      const row = await createImageResource.run({name: 'the beach.png', bytes});

      const [fileKey, storedBytes] = fileStore.store.mock.calls[0] ?? [];

      expect(fileKey?.value).toBe(`resources/${row.id}/the beach.png`);
      expect(storedBytes).toBe(bytes);
    });

    it('should write the row before it copies the File', async () => {
      await createImageResource.run({name: 'the beach.png', bytes: someBytes()});

      expect(steps.indexOf('create')).toBeLessThan(steps.indexOf('store'));
    });

    it('should raise ImageResourceCreatedDomainEvent after the transaction commits', async () => {
      await createImageResource.run({name: 'the beach.png', bytes: someBytes()});

      const [events] = eventBus.publish.mock.calls[0] ?? [];

      expect(events?.[0]).toBeInstanceOf(ImageResourceCreatedDomainEvent);
      expect(steps).toStrictEqual(['create', 'store', 'commit', 'publish']);
    });

    it('should not wait for the handlers of its events', async () => {
      eventBus.publish.mockImplementation(() => new Promise(() => {}));

      await expect(
        createImageResource.run({name: 'the beach.png', bytes: someBytes()})
      ).resolves.toBeDefined();
    });

    it('should refuse the same bytes, and write nothing and copy nothing', async () => {
      resourceRepository.findImageResourceByChecksum.mockResolvedValue(
        ImageResourceBuilder.anImageResource().build()
      );

      await expect(
        createImageResource.run({name: 'the beach.png', bytes: someBytes()})
      ).rejects.toThrow(DuplicateResourceError);

      expect(steps).toStrictEqual([]);
    });

    it('should name the Resource that holds the bytes and its Ingest state', async () => {
      const stored = ImageResourceBuilder.anImageResource()
        .withIngestState('failed')
        .withReason('ingest_error')
        .build();
      resourceRepository.findImageResourceByChecksum.mockResolvedValue(stored);

      const error = await createImageResource
        .run({name: 'the beach.png', bytes: someBytes()})
        .catch((thrown: DuplicateResourceError) => thrown);

      expect((error as DuplicateResourceError).resource).toStrictEqual({
        resourceId: stored.toPrimitives().id,
        name: stored.toPrimitives().name,
        ingestState: 'failed'
      });
    });

    it.each(['../../escaped.png', 'resources/../escaped.png', '..'])(
      'should refuse the name %j, which escapes the folder the application owns',
      async name => {
        await expect(createImageResource.run({name, bytes: someBytes()})).rejects.toThrow(
          ValueObjectError
        );

        expect(steps).toStrictEqual([]);
      }
    );

    it('should refuse a name that the Gate of the images refuses, and write nothing', async () => {
      contentTypeResolver.resolveImage.mockImplementation(name => {
        throw UnsupportedContentTypeError.causeTheNameHoldsNoAdmittedExtension(name);
      });

      await expect(
        createImageResource.run({name: 'the notes.md', bytes: someBytes()})
      ).rejects.toThrow(UnsupportedContentTypeError);

      expect(contentTypeResolver.resolveImage).toHaveBeenCalledWith('the notes.md');
      expect(steps).toStrictEqual([]);
    });

    it('should refuse a name that holds no letter and no digit', async () => {
      await expect(
        createImageResource.run({name: '   ', bytes: someBytes()})
      ).rejects.toThrow(ValueObjectError);

      expect(steps).toStrictEqual([]);
    });

    it('should give the same Checksum to the same bytes', async () => {
      const bytes = someBytes();

      await createImageResource.run({name: 'the beach.png', bytes});
      await createImageResource.run({name: 'a copy.png', bytes});

      const [first, second] = resourceRepository.findImageResourceByChecksum.mock.calls;

      expect(first?.[0].value).toBe(second?.[0].value);
    });
  });
});

const someBytes = (): Buffer => Buffer.from(StringMother.randomChecksum(), 'utf8');
