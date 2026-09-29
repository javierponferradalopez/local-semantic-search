import {ImageResourceIngestFailedDomainEvent} from '../../../../../src/core/ingestion/domain/events/ImageResourceIngestFailedDomainEvent';
import type {ResourceRepository} from '../../../../../src/core/resources/domain/ResourceRepository';
import {MarkImageResourceAsFailedOnImageResourceIngestFailed} from '../../../../../src/core/resources/use-cases/MarkImageResourceAsFailedOnImageResourceIngestFailed';
import type {TransactionRunner} from '../../../../../src/core/shared/domain/services/TransactionRunner';
import {ImageResourceBuilder} from '../../../../utils/builders/image-resource/ImageResourceBuilder';
import {TextResourceBuilder} from '../../../../utils/builders/text-resource/TextResourceBuilder';
import {type MockProxy, mock} from '../../../../utils/mock';
import {StringMother} from '../../../../utils/object-mother/StringMother';

describe('MarkImageResourceAsFailedOnImageResourceIngestFailed', () => {
  let resourceRepository: MockProxy<ResourceRepository>;
  let transactionRunner: MockProxy<TransactionRunner>;
  let handler: MarkImageResourceAsFailedOnImageResourceIngestFailed;
  let steps: string[];

  beforeEach(() => {
    steps = [];
    resourceRepository = mock<ResourceRepository>();
    transactionRunner = mock<TransactionRunner>();

    resourceRepository.update.mockImplementation(async () => {
      steps.push('update');
    });
    transactionRunner.run.mockImplementation(async work => {
      const result = await work();
      steps.push('commit');

      return result;
    });

    handler = new MarkImageResourceAsFailedOnImageResourceIngestFailed({
      resourceRepository,
      transactionRunner
    });
  });

  describe('#subscribeTo', () => {
    it('should subscribe to ImageResourceIngestFailedDomainEvent', () => {
      expect(handler.subscribeTo()).toStrictEqual([ImageResourceIngestFailedDomainEvent]);
    });
  });

  describe('#handle', () => {
    it('should mark the Resource Failed with the Reason of the event, inside the transaction', async () => {
      const imageResource = ImageResourceBuilder.anImageResource().build();
      resourceRepository.find.mockResolvedValue(imageResource);

      await handler.handle(
        new ImageResourceIngestFailedDomainEvent({
          aggregateId: imageResource.id.value,
          reason: 'ingest_error'
        })
      );

      const [updated] = resourceRepository.update.mock.calls[0] ?? [];

      expect(updated?.toPrimitives()).toMatchObject({
        ingestState: 'failed',
        reason: 'ingest_error'
      });
      expect(steps).toStrictEqual(['update', 'commit']);
    });

    it('should ignore an identifier that no Resource holds any more', async () => {
      resourceRepository.find.mockResolvedValue(undefined);

      await expect(
        handler.handle(
          new ImageResourceIngestFailedDomainEvent({
            aggregateId: StringMother.randomUuid(),
            reason: 'ingest_error'
          })
        )
      ).resolves.toBeUndefined();

      expect(resourceRepository.update).not.toHaveBeenCalled();
    });

    it('should ignore an identifier that a Text Resource holds', async () => {
      const textResource = TextResourceBuilder.aTextResource().build();
      resourceRepository.find.mockResolvedValue(textResource);

      await handler.handle(
        new ImageResourceIngestFailedDomainEvent({
          aggregateId: textResource.id.value,
          reason: 'ingest_error'
        })
      );

      expect(resourceRepository.update).not.toHaveBeenCalled();
      expect(textResource.toPrimitives().ingestState).toBe('ingesting');
    });
  });
});
