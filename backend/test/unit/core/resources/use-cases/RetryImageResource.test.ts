import type {IngestState} from 'contract/IngestState';
import {ResourceNotFailedError} from '../../../../../src/core/resources/domain/errors/ResourceNotFailedError';
import {ResourceNotFoundError} from '../../../../../src/core/resources/domain/errors/ResourceNotFoundError';
import {ImageResourceRetriedDomainEvent} from '../../../../../src/core/resources/domain/events/ImageResourceRetriedDomainEvent';
import type {ImageResource} from '../../../../../src/core/resources/domain/ImageResource';
import type {ResourceRepository} from '../../../../../src/core/resources/domain/ResourceRepository';
import {RetryImageResource} from '../../../../../src/core/resources/use-cases/RetryImageResource';
import type {EventBus} from '../../../../../src/core/shared/domain/services/EventBus';
import type {FileStore} from '../../../../../src/core/shared/domain/services/FileStore';
import type {TransactionRunner} from '../../../../../src/core/shared/domain/services/TransactionRunner';
import {ImageResourceBuilder} from '../../../../utils/builders/image-resource/ImageResourceBuilder';
import {TextResourceBuilder} from '../../../../utils/builders/text-resource/TextResourceBuilder';
import {type MockProxy, mock} from '../../../../utils/mock';
import {StringMother} from '../../../../utils/object-mother/StringMother';

describe('RetryImageResource', () => {
  let resourceRepository: MockProxy<ResourceRepository>;
  let fileStore: MockProxy<FileStore>;
  let eventBus: MockProxy<EventBus>;
  let transactionRunner: MockProxy<TransactionRunner>;
  let retryImageResource: RetryImageResource;
  let steps: string[];

  beforeEach(() => {
    steps = [];
    resourceRepository = mock<ResourceRepository>();
    fileStore = mock<FileStore>();
    eventBus = mock<EventBus>();
    transactionRunner = mock<TransactionRunner>();

    resourceRepository.update.mockImplementation(async () => {
      steps.push('update');
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

    retryImageResource = new RetryImageResource({
      resourceRepository,
      fileStore,
      eventBus,
      transactionRunner
    });
  });

  describe('#run', () => {
    it('should put a Failed Resource back in Ingesting, and clear its Reason', async () => {
      const imageResource = aStoredImageResource('failed');

      await retryImageResource.run({id: imageResource.id.value});

      const [updated] = resourceRepository.update.mock.calls[0] ?? [];

      expect(updated?.toPrimitives().ingestState).toBe('ingesting');
      expect(updated?.toPrimitives().reason).toBeUndefined();
    });

    it('should keep the File of the Resource', async () => {
      const imageResource = aStoredImageResource('failed');
      const fileKey = imageResource.fileKey.value;

      await retryImageResource.run({id: imageResource.id.value});

      expect(fileStore.delete).not.toHaveBeenCalled();
      expect(fileStore.store).not.toHaveBeenCalled();
      expect(resourceRepository.update.mock.calls[0]?.[0].fileKey.value).toBe(fileKey);
    });

    it('should give the row of the Resource in Ingesting', async () => {
      const imageResource = aStoredImageResource('failed');
      const {id, name, contentType, createdAt, fileKey} = imageResource.toPrimitives();

      const row = await retryImageResource.run({id});

      expect(row).toStrictEqual({
        id,
        name,
        contentType,
        ingestState: 'ingesting',
        createdAt,
        fileUrl: `/files/${fileKey}`
      });
    });

    it('should raise ImageResourceRetriedDomainEvent after the transaction commits', async () => {
      const imageResource = aStoredImageResource('failed');

      await retryImageResource.run({id: imageResource.id.value});

      const [events] = eventBus.publish.mock.calls[0] ?? [];

      expect(events?.[0]).toBeInstanceOf(ImageResourceRetriedDomainEvent);
      expect(events?.[0]?.aggregateId).toBe(imageResource.id.value);
      expect(steps).toStrictEqual(['update', 'commit', 'publish']);
    });

    it('should not wait for the handlers of its events', async () => {
      const imageResource = aStoredImageResource('failed');
      eventBus.publish.mockImplementation(() => new Promise(() => {}));

      await expect(
        retryImageResource.run({id: imageResource.id.value})
      ).resolves.toBeDefined();
    });

    it.each(['ingesting', 'ready'] satisfies IngestState[])(
      'should refuse a Resource that is %s, and change nothing',
      async ingestState => {
        const imageResource = aStoredImageResource(ingestState);

        await expect(
          retryImageResource.run({id: imageResource.id.value})
        ).rejects.toThrow(ResourceNotFailedError);

        expect(steps).toStrictEqual([]);
      }
    );

    it('should refuse an identifier that no Resource holds, and change nothing', async () => {
      resourceRepository.find.mockResolvedValue(undefined);

      await expect(
        retryImageResource.run({id: StringMother.randomUuid()})
      ).rejects.toThrow(ResourceNotFoundError);

      expect(steps).toStrictEqual([]);
    });

    it('should refuse an identifier that a Text Resource holds, and change nothing', async () => {
      const textResource = TextResourceBuilder.aTextResource()
        .withIngestState('failed')
        .withReason('ingest_error')
        .build();
      resourceRepository.find.mockResolvedValue(textResource);

      await expect(retryImageResource.run({id: textResource.id.value})).rejects.toThrow(
        ResourceNotFoundError
      );

      expect(steps).toStrictEqual([]);
    });
  });

  const aStoredImageResource = (ingestState: IngestState): ImageResource => {
    const builder = ImageResourceBuilder.anImageResource().withIngestState(ingestState);
    const imageResource = (
      ingestState === 'failed' ? builder.withReason('image_too_large') : builder
    ).build();

    resourceRepository.find.mockResolvedValue(imageResource);

    return imageResource;
  };
});
