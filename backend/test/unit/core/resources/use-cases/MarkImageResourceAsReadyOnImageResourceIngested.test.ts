import {ImageResourceIngestedDomainEvent} from '../../../../../src/core/ingestion/domain/events/ImageResourceIngestedDomainEvent';
import type {ResourceRepository} from '../../../../../src/core/resources/domain/ResourceRepository';
import {MarkImageResourceAsReadyOnImageResourceIngested} from '../../../../../src/core/resources/use-cases/MarkImageResourceAsReadyOnImageResourceIngested';
import type {TransactionRunner} from '../../../../../src/core/shared/domain/services/TransactionRunner';
import {ImageResourceBuilder} from '../../../../utils/builders/image-resource/ImageResourceBuilder';
import {TextResourceBuilder} from '../../../../utils/builders/text-resource/TextResourceBuilder';
import {type MockProxy, mock} from '../../../../utils/mock';
import {StringMother} from '../../../../utils/object-mother/StringMother';

describe('MarkImageResourceAsReadyOnImageResourceIngested', () => {
  let resourceRepository: MockProxy<ResourceRepository>;
  let transactionRunner: MockProxy<TransactionRunner>;
  let handler: MarkImageResourceAsReadyOnImageResourceIngested;
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

    handler = new MarkImageResourceAsReadyOnImageResourceIngested({
      resourceRepository,
      transactionRunner
    });
  });

  describe('#subscribeTo', () => {
    it('should subscribe to ImageResourceIngestedDomainEvent', () => {
      expect(handler.subscribeTo()).toStrictEqual([ImageResourceIngestedDomainEvent]);
    });
  });

  describe('#handle', () => {
    it('should mark the Resource Ready inside the transaction', async () => {
      const imageResource = ImageResourceBuilder.anImageResource().build();
      resourceRepository.find.mockResolvedValue(imageResource);

      await handler.handle(
        new ImageResourceIngestedDomainEvent({aggregateId: imageResource.id.value})
      );

      const [updated] = resourceRepository.update.mock.calls[0] ?? [];

      expect(updated?.toPrimitives().ingestState).toBe('ready');
      expect(steps).toStrictEqual(['update', 'commit']);
    });

    it('should ignore an identifier that no Resource holds any more', async () => {
      resourceRepository.find.mockResolvedValue(undefined);

      await expect(
        handler.handle(
          new ImageResourceIngestedDomainEvent({aggregateId: StringMother.randomUuid()})
        )
      ).resolves.toBeUndefined();

      expect(resourceRepository.update).not.toHaveBeenCalled();
    });

    it('should ignore an identifier that a Text Resource holds', async () => {
      const textResource = TextResourceBuilder.aTextResource().build();
      resourceRepository.find.mockResolvedValue(textResource);

      await handler.handle(
        new ImageResourceIngestedDomainEvent({aggregateId: textResource.id.value})
      );

      expect(resourceRepository.update).not.toHaveBeenCalled();
      expect(textResource.toPrimitives().ingestState).toBe('ingesting');
    });
  });
});
