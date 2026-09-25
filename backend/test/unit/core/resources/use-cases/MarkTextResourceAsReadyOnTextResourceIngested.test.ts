import {TextResourceIngestedDomainEvent} from '../../../../../src/core/ingestion/domain/events/TextResourceIngestedDomainEvent';
import type {ResourceRepository} from '../../../../../src/core/resources/domain/ResourceRepository';
import {MarkTextResourceAsReadyOnTextResourceIngested} from '../../../../../src/core/resources/use-cases/MarkTextResourceAsReadyOnTextResourceIngested';
import type {TransactionRunner} from '../../../../../src/core/shared/domain/services/TransactionRunner';
import {TextResourceBuilder} from '../../../../utils/builders/text-resource/TextResourceBuilder';
import {type MockProxy, mock} from '../../../../utils/mock';
import {StringMother} from '../../../../utils/object-mother/StringMother';

describe('MarkTextResourceAsReadyOnTextResourceIngested', () => {
  let resourceRepository: MockProxy<ResourceRepository>;
  let transactionRunner: MockProxy<TransactionRunner>;
  let handler: MarkTextResourceAsReadyOnTextResourceIngested;
  let steps: string[];

  beforeEach(() => {
    steps = [];
    resourceRepository = mock<ResourceRepository>();
    transactionRunner = mock<TransactionRunner>();

    resourceRepository.save.mockImplementation(async () => {
      steps.push('save');
    });
    transactionRunner.run.mockImplementation(async work => {
      const result = await work();
      steps.push('commit');

      return result;
    });

    handler = new MarkTextResourceAsReadyOnTextResourceIngested({
      resourceRepository,
      transactionRunner
    });
  });

  describe('#subscribeTo', () => {
    it('should subscribe to TextResourceIngestedDomainEvent', () => {
      expect(handler.subscribeTo()).toStrictEqual([TextResourceIngestedDomainEvent]);
    });
  });

  describe('#handle', () => {
    it('should mark the Resource Ready inside the transaction', async () => {
      const textResource = TextResourceBuilder.aTextResource().build();
      resourceRepository.find.mockResolvedValue(textResource);

      await handler.handle(
        new TextResourceIngestedDomainEvent({aggregateId: textResource.id.value})
      );

      const [saved] = resourceRepository.save.mock.calls[0] ?? [];

      expect(saved?.toPrimitives().ingestState).toBe('ready');
      expect(steps).toStrictEqual(['save', 'commit']);
    });

    it('should ignore an identifier that no Resource holds any more', async () => {
      resourceRepository.find.mockResolvedValue(undefined);

      await expect(
        handler.handle(
          new TextResourceIngestedDomainEvent({aggregateId: StringMother.randomUuid()})
        )
      ).resolves.toBeUndefined();

      expect(resourceRepository.save).not.toHaveBeenCalled();
    });
  });
});
