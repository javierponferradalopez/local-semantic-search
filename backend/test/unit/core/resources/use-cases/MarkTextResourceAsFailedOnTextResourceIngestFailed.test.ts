import {TextResourceIngestFailedDomainEvent} from '../../../../../src/core/ingestion/domain/events/TextResourceIngestFailedDomainEvent';
import type {ResourceRepository} from '../../../../../src/core/resources/domain/ResourceRepository';
import {MarkTextResourceAsFailedOnTextResourceIngestFailed} from '../../../../../src/core/resources/use-cases/MarkTextResourceAsFailedOnTextResourceIngestFailed';
import type {TransactionRunner} from '../../../../../src/core/shared/domain/services/TransactionRunner';
import {TextResourceBuilder} from '../../../../utils/builders/text-resource/TextResourceBuilder';
import {type MockProxy, mock} from '../../../../utils/mock';
import {StringMother} from '../../../../utils/object-mother/StringMother';

describe('MarkTextResourceAsFailedOnTextResourceIngestFailed', () => {
  let resourceRepository: MockProxy<ResourceRepository>;
  let transactionRunner: MockProxy<TransactionRunner>;
  let handler: MarkTextResourceAsFailedOnTextResourceIngestFailed;
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

    handler = new MarkTextResourceAsFailedOnTextResourceIngestFailed({
      resourceRepository,
      transactionRunner
    });
  });

  describe('#subscribeTo', () => {
    it('should subscribe to TextResourceIngestFailedDomainEvent', () => {
      expect(handler.subscribeTo()).toStrictEqual([TextResourceIngestFailedDomainEvent]);
    });
  });

  describe('#handle', () => {
    it('should mark the Resource Failed with the Reason of the event, inside the transaction', async () => {
      const textResource = TextResourceBuilder.aTextResource().build();
      resourceRepository.find.mockResolvedValue(textResource);

      await handler.handle(
        new TextResourceIngestFailedDomainEvent({
          aggregateId: textResource.id.value,
          reason: 'no_text_found'
        })
      );

      const [updated] = resourceRepository.update.mock.calls[0] ?? [];

      expect(updated?.toPrimitives()).toMatchObject({
        ingestState: 'failed',
        reason: 'no_text_found'
      });
      expect(steps).toStrictEqual(['update', 'commit']);
    });

    it('should ignore an identifier that no Resource holds any more', async () => {
      resourceRepository.find.mockResolvedValue(undefined);

      await expect(
        handler.handle(
          new TextResourceIngestFailedDomainEvent({
            aggregateId: StringMother.randomUuid(),
            reason: 'no_text_found'
          })
        )
      ).resolves.toBeUndefined();

      expect(resourceRepository.update).not.toHaveBeenCalled();
    });
  });
});
