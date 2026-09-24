import {INGEST_STATES, type IngestState} from 'contract/IngestState';
import {ResourceNotFoundError} from '../../../../../src/core/resources/domain/errors/ResourceNotFoundError';
import {TextResourceDeletedDomainEvent} from '../../../../../src/core/resources/domain/events/TextResourceDeletedDomainEvent';
import type {ResourceRepository} from '../../../../../src/core/resources/domain/ResourceRepository';
import type {TextResource} from '../../../../../src/core/resources/domain/TextResource';
import {DeleteResource} from '../../../../../src/core/resources/use-cases/DeleteResource';
import type {EventBus} from '../../../../../src/core/shared/domain/services/EventBus';
import type {FileStore} from '../../../../../src/core/shared/domain/services/FileStore';
import type {TransactionRunner} from '../../../../../src/core/shared/domain/services/TransactionRunner';
import {TextResourceBuilder} from '../../../../utils/builders/text-resource/TextResourceBuilder';
import {type MockProxy, mock} from '../../../../utils/mock';
import {StringMother} from '../../../../utils/object-mother/StringMother';

describe('DeleteResource', () => {
  let resourceRepository: MockProxy<ResourceRepository>;
  let fileStore: MockProxy<FileStore>;
  let eventBus: MockProxy<EventBus>;
  let transactionRunner: MockProxy<TransactionRunner>;
  let deleteResource: DeleteResource;
  let steps: string[];

  beforeEach(() => {
    steps = [];
    resourceRepository = mock<ResourceRepository>();
    fileStore = mock<FileStore>();
    eventBus = mock<EventBus>();
    transactionRunner = mock<TransactionRunner>();

    resourceRepository.delete.mockImplementation(async () => {
      steps.push('delete the row');
    });
    fileStore.delete.mockImplementation(async () => {
      steps.push('delete the File');
    });
    eventBus.publish.mockImplementation(async () => {
      steps.push('publish');
    });
    transactionRunner.run.mockImplementation(async work => {
      const result = await work();
      steps.push('commit');

      return result;
    });

    deleteResource = new DeleteResource({
      resourceRepository,
      fileStore,
      eventBus,
      transactionRunner
    });
  });

  describe('#run', () => {
    it('should delete the row and the File of the Resource', async () => {
      const textResource = aStoredTextResource();

      await deleteResource.run({id: textResource.id.value});

      expect(resourceRepository.delete).toHaveBeenCalledWith(textResource);
      expect(fileStore.delete.mock.calls[0]?.[0].value).toBe(textResource.fileKey.value);
    });

    it('should raise TextResourceDeletedDomainEvent after the transaction commits', async () => {
      const textResource = aStoredTextResource();

      await deleteResource.run({id: textResource.id.value});

      const [events] = eventBus.publish.mock.calls[0] ?? [];

      expect(events?.[0]).toBeInstanceOf(TextResourceDeletedDomainEvent);
      expect(events?.[0]?.aggregateId).toBe(textResource.id.value);
      expect(steps).toStrictEqual([
        'delete the row',
        'delete the File',
        'commit',
        'publish'
      ]);
    });

    it('should not wait for the handlers of its events', async () => {
      const textResource = aStoredTextResource();
      eventBus.publish.mockImplementation(() => new Promise(() => {}));

      await expect(
        deleteResource.run({id: textResource.id.value})
      ).resolves.toBeUndefined();
    });

    it.each(INGEST_STATES)(
      'should admit a Resource that is %s',
      async (ingestState: IngestState) => {
        const textResource = aStoredTextResource(ingestState);

        await deleteResource.run({id: textResource.id.value});

        expect(resourceRepository.delete).toHaveBeenCalledWith(textResource);
      }
    );

    it('should refuse an identifier that no Resource holds, and delete nothing', async () => {
      resourceRepository.find.mockResolvedValue(undefined);

      await expect(deleteResource.run({id: StringMother.randomUuid()})).rejects.toThrow(
        ResourceNotFoundError
      );

      expect(steps).toStrictEqual([]);
    });
  });

  const aStoredTextResource = (ingestState: IngestState = 'ingesting'): TextResource => {
    const builder = TextResourceBuilder.aTextResource().withIngestState(ingestState);
    const textResource = (
      ingestState === 'failed' ? builder.withReason('ingest_error') : builder
    ).build();

    resourceRepository.find.mockResolvedValue(textResource);

    return textResource;
  };
});
