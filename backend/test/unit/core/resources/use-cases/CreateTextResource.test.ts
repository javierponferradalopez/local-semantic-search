import {DuplicateResourceError} from '../../../../../src/core/resources/domain/errors/DuplicateResourceError';
import {TextResourceCreatedDomainEvent} from '../../../../../src/core/resources/domain/events/TextResourceCreatedDomainEvent';
import type {ResourceRepository} from '../../../../../src/core/resources/domain/ResourceRepository';
import type {ContentTypeResolver} from '../../../../../src/core/resources/domain/services/ContentTypeResolver';
import {TextContentType} from '../../../../../src/core/resources/domain/value-objects/TextContentType';
import {CreateTextResource} from '../../../../../src/core/resources/use-cases/CreateTextResource';
import {ValueObjectError} from '../../../../../src/core/shared/domain/errors/ValueObjectError';
import type {EventBus} from '../../../../../src/core/shared/domain/services/EventBus';
import type {FileStore} from '../../../../../src/core/shared/domain/services/FileStore';
import type {TransactionRunner} from '../../../../../src/core/shared/domain/services/TransactionRunner';
import {TextResourceBuilder} from '../../../../utils/builders/text-resource/TextResourceBuilder';
import {type MockProxy, mock} from '../../../../utils/mock';
import {StringMother} from '../../../../utils/object-mother/StringMother';

const A_FILE_URL = '/files/resources/the-notes.md';

describe('CreateTextResource', () => {
  let resourceRepository: MockProxy<ResourceRepository>;
  let fileStore: MockProxy<FileStore>;
  let eventBus: MockProxy<EventBus>;
  let transactionRunner: MockProxy<TransactionRunner>;
  let contentTypeResolver: MockProxy<ContentTypeResolver>;
  let createTextResource: CreateTextResource;
  let steps: string[];

  beforeEach(() => {
    steps = [];
    resourceRepository = mock<ResourceRepository>();
    fileStore = mock<FileStore>();
    eventBus = mock<EventBus>();
    transactionRunner = mock<TransactionRunner>();
    contentTypeResolver = mock<ContentTypeResolver>();

    resourceRepository.findByChecksum.mockResolvedValue(undefined);
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
    contentTypeResolver.resolveText.mockReturnValue(
      TextContentType.of({value: 'markdown'})
    );

    createTextResource = new CreateTextResource({
      resourceRepository,
      fileStore,
      eventBus,
      transactionRunner,
      contentTypeResolver
    });
  });

  describe('#run', () => {
    it('should give the row of a Resource that is Ingesting', async () => {
      const row = await createTextResource.run({
        name: 'the notes.md',
        bytes: someBytes()
      });

      expect(row.name).toBe('the notes.md');
      expect(row.contentType).toBe('markdown');
      expect(row.ingestState).toBe('ingesting');
      expect(row.fileUrl).toBe(A_FILE_URL);
      expect(row).not.toHaveProperty('reason');
    });

    it('should store the File under the key of the Resource', async () => {
      const bytes = someBytes();

      const row = await createTextResource.run({name: 'the notes.md', bytes});

      const [fileKey, storedBytes] = fileStore.store.mock.calls[0] ?? [];

      expect(fileKey?.value).toBe(`resources/${row.id}/the notes.md`);
      expect(storedBytes).toBe(bytes);
    });

    it('should write the row before it copies the File', async () => {
      await createTextResource.run({name: 'the notes.md', bytes: someBytes()});

      expect(steps.indexOf('create')).toBeLessThan(steps.indexOf('store'));
    });

    it('should raise TextResourceCreatedDomainEvent after the transaction commits', async () => {
      await createTextResource.run({name: 'the notes.md', bytes: someBytes()});

      const [events] = eventBus.publish.mock.calls[0] ?? [];

      expect(events?.[0]).toBeInstanceOf(TextResourceCreatedDomainEvent);
      expect(steps).toStrictEqual(['create', 'store', 'commit', 'publish']);
    });

    it('should not wait for the handlers of its events', async () => {
      eventBus.publish.mockImplementation(() => new Promise(() => {}));

      await expect(
        createTextResource.run({name: 'the notes.md', bytes: someBytes()})
      ).resolves.toBeDefined();
    });

    it('should refuse the same bytes, and write nothing and copy nothing', async () => {
      resourceRepository.findByChecksum.mockResolvedValue(
        TextResourceBuilder.aTextResource().build()
      );

      await expect(
        createTextResource.run({name: 'the notes.md', bytes: someBytes()})
      ).rejects.toThrow(DuplicateResourceError);

      expect(steps).toStrictEqual([]);
    });

    it('should name the Resource that holds the bytes and its Ingest state', async () => {
      const stored = TextResourceBuilder.aTextResource()
        .withIngestState('failed')
        .withReason('ingest_error')
        .build();
      resourceRepository.findByChecksum.mockResolvedValue(stored);

      const error = await createTextResource
        .run({name: 'the notes.md', bytes: someBytes()})
        .catch((thrown: DuplicateResourceError) => thrown);

      expect((error as DuplicateResourceError).resource).toStrictEqual({
        resourceId: stored.toPrimitives().id,
        name: stored.toPrimitives().name,
        ingestState: 'failed'
      });
    });

    it.each(['../../escaped.md', 'resources/../escaped.md', '..'])(
      'should refuse the name %j, which escapes the folder the application owns',
      async name => {
        await expect(createTextResource.run({name, bytes: someBytes()})).rejects.toThrow(
          ValueObjectError
        );

        expect(steps).toStrictEqual([]);
      }
    );

    it('should refuse a name that holds no letter and no digit', async () => {
      await expect(
        createTextResource.run({name: '   ', bytes: someBytes()})
      ).rejects.toThrow(ValueObjectError);

      expect(steps).toStrictEqual([]);
    });

    it('should give the same Checksum to the same bytes', async () => {
      const bytes = someBytes();

      await createTextResource.run({name: 'the notes.md', bytes});
      await createTextResource.run({name: 'a copy.md', bytes});

      const [first, second] = resourceRepository.findByChecksum.mock.calls;

      expect(first?.[0].value).toBe(second?.[0].value);
    });
  });
});

const someBytes = (): Buffer => Buffer.from(StringMother.randomChecksum(), 'utf8');
