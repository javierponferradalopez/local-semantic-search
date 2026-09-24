import type {IngestState} from 'contract/IngestState';
import {ResourceNotFailedError} from '../../../../../src/core/resources/domain/errors/ResourceNotFailedError';
import {ResourceNotFoundError} from '../../../../../src/core/resources/domain/errors/ResourceNotFoundError';
import {TextResourceRetriedDomainEvent} from '../../../../../src/core/resources/domain/events/TextResourceRetriedDomainEvent';
import type {ResourceRepository} from '../../../../../src/core/resources/domain/ResourceRepository';
import type {TextResource} from '../../../../../src/core/resources/domain/TextResource';
import {RetryTextResource} from '../../../../../src/core/resources/use-cases/RetryTextResource';
import type {EventBus} from '../../../../../src/core/shared/domain/services/EventBus';
import type {FileStore} from '../../../../../src/core/shared/domain/services/FileStore';
import type {TransactionRunner} from '../../../../../src/core/shared/domain/services/TransactionRunner';
import {TextResourceBuilder} from '../../../../utils/builders/text-resource/TextResourceBuilder';
import {type MockProxy, mock} from '../../../../utils/mock';
import {StringMother} from '../../../../utils/object-mother/StringMother';

describe('RetryTextResource', () => {
  let resourceRepository: MockProxy<ResourceRepository>;
  let fileStore: MockProxy<FileStore>;
  let eventBus: MockProxy<EventBus>;
  let transactionRunner: MockProxy<TransactionRunner>;
  let retryTextResource: RetryTextResource;
  let steps: string[];

  beforeEach(() => {
    steps = [];
    resourceRepository = mock<ResourceRepository>();
    fileStore = mock<FileStore>();
    eventBus = mock<EventBus>();
    transactionRunner = mock<TransactionRunner>();

    resourceRepository.save.mockImplementation(async () => {
      steps.push('save');
    });
    eventBus.publish.mockImplementation(async () => {
      steps.push('publish');
    });
    transactionRunner.run.mockImplementation(async work => {
      const result = await work();
      steps.push('commit');

      return result;
    });
    fileStore.urlOf.mockImplementation(key => `/files/${key.value}`);

    retryTextResource = new RetryTextResource({
      resourceRepository,
      fileStore,
      eventBus,
      transactionRunner
    });
  });

  describe('#run', () => {
    it('should put a Failed Resource back in Ingesting, and clear its Reason', async () => {
      const textResource = aStoredTextResource('failed');

      await retryTextResource.run({id: textResource.id.value});

      const [saved] = resourceRepository.save.mock.calls[0] ?? [];

      expect(saved?.toPrimitives().ingestState).toBe('ingesting');
      expect(saved?.toPrimitives().reason).toBeUndefined();
    });

    it('should keep the File of the Resource', async () => {
      const textResource = aStoredTextResource('failed');
      const fileKey = textResource.fileKey.value;

      await retryTextResource.run({id: textResource.id.value});

      expect(fileStore.delete).not.toHaveBeenCalled();
      expect(fileStore.store).not.toHaveBeenCalled();
      expect(resourceRepository.save.mock.calls[0]?.[0].fileKey.value).toBe(fileKey);
    });

    it('should give the row of the Resource in Ingesting', async () => {
      const textResource = aStoredTextResource('failed');
      const {id, name, contentType, createdAt, fileKey} = textResource.toPrimitives();

      const row = await retryTextResource.run({id});

      expect(row).toStrictEqual({
        id,
        name,
        contentType,
        ingestState: 'ingesting',
        createdAt,
        fileUrl: `/files/${fileKey}`
      });
    });

    it('should raise TextResourceRetriedDomainEvent after the transaction commits', async () => {
      const textResource = aStoredTextResource('failed');

      await retryTextResource.run({id: textResource.id.value});

      const [events] = eventBus.publish.mock.calls[0] ?? [];

      expect(events?.[0]).toBeInstanceOf(TextResourceRetriedDomainEvent);
      expect(events?.[0]?.aggregateId).toBe(textResource.id.value);
      expect(steps).toStrictEqual(['save', 'commit', 'publish']);
    });

    it.each(['ingesting', 'ready'] satisfies IngestState[])(
      'should refuse a Resource that is %s, and change nothing',
      async ingestState => {
        const textResource = aStoredTextResource(ingestState);

        await expect(retryTextResource.run({id: textResource.id.value})).rejects.toThrow(
          ResourceNotFailedError
        );

        expect(steps).toStrictEqual([]);
      }
    );

    it('should refuse an identifier that no Resource holds, and change nothing', async () => {
      resourceRepository.find.mockResolvedValue(undefined);

      await expect(
        retryTextResource.run({id: StringMother.randomUuid()})
      ).rejects.toThrow(ResourceNotFoundError);

      expect(steps).toStrictEqual([]);
    });
  });

  const aStoredTextResource = (ingestState: IngestState): TextResource => {
    const builder = TextResourceBuilder.aTextResource().withIngestState(ingestState);
    const textResource = (
      ingestState === 'failed' ? builder.withReason('ingest_error') : builder
    ).build();

    resourceRepository.find.mockResolvedValue(textResource);

    return textResource;
  };
});
