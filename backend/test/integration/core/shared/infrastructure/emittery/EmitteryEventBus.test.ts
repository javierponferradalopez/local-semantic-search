import {TextResourceCreatedDomainEvent} from '../../../../../../src/core/resources/domain/events/TextResourceCreatedDomainEvent';
import {TextResourceDeletedDomainEvent} from '../../../../../../src/core/resources/domain/events/TextResourceDeletedDomainEvent';
import {TextResourceRetriedDomainEvent} from '../../../../../../src/core/resources/domain/events/TextResourceRetriedDomainEvent';
import type {DomainEvent} from '../../../../../../src/core/shared/domain/DomainEvent';
import type {
  DomainEventClass,
  DomainEventHandler
} from '../../../../../../src/core/shared/domain/DomainEventHandler';
import {EmitteryEventBus} from '../../../../../../src/core/shared/infrastructure/emittery/EmitteryEventBus';
import {StringMother} from '../../../../../utils/object-mother/StringMother';

const anEventOfACreatedResource = (): TextResourceCreatedDomainEvent => {
  const aggregateId = StringMother.randomUuid();

  return new TextResourceCreatedDomainEvent({
    aggregateId,
    contentType: 'markdown',
    fileKey: `resources/${aggregateId}/the notes.md`
  });
};

const anEventOfARetriedResource = (): TextResourceRetriedDomainEvent => {
  const aggregateId = StringMother.randomUuid();

  return new TextResourceRetriedDomainEvent({
    aggregateId,
    contentType: 'markdown',
    fileKey: `resources/${aggregateId}/the notes.md`
  });
};

const aHandlerOf = (
  events: DomainEventClass<DomainEvent>[],
  handle: (event: DomainEvent) => Promise<void>
): DomainEventHandler => ({
  subscribeTo: (): DomainEventClass<DomainEvent>[] => events,
  handle
});

const aTick = (): Promise<void> => new Promise(resolve => setImmediate(resolve));

describe('EmitteryEventBus', () => {
  let eventBus: EmitteryEventBus;

  beforeEach(() => {
    eventBus = new EmitteryEventBus();
  });

  describe('#publish', () => {
    it('should give the event to the handlers of its name alone', async () => {
      const ofCreated: string[] = [];
      const ofDeleted: string[] = [];
      eventBus.subscribe(
        aHandlerOf([TextResourceCreatedDomainEvent], async event => {
          ofCreated.push(event.aggregateId);
        })
      );
      eventBus.subscribe(
        aHandlerOf([TextResourceDeletedDomainEvent], async event => {
          ofDeleted.push(event.aggregateId);
        })
      );
      const event = anEventOfACreatedResource();

      await eventBus.publish([event]);

      expect(ofCreated).toStrictEqual([event.aggregateId]);
      expect(ofDeleted).toStrictEqual([]);
    });

    it('should give each event to a handler that subscribes to two names', async () => {
      const reached: string[] = [];
      eventBus.subscribe(
        aHandlerOf(
          [TextResourceCreatedDomainEvent, TextResourceRetriedDomainEvent],
          async event => {
            reached.push(event.aggregateId);
          }
        )
      );
      const created = anEventOfACreatedResource();
      const retried = anEventOfARetriedResource();

      await eventBus.publish([created, retried]);

      expect(reached.toSorted()).toStrictEqual(
        [created.aggregateId, retried.aggregateId].toSorted()
      );
    });

    it('should end when the handlers end', async () => {
      let hasEnded = false;
      eventBus.subscribe(
        aHandlerOf([TextResourceCreatedDomainEvent], async () => {
          await new Promise(resolve => setTimeout(resolve, 50));
          hasEnded = true;
        })
      );

      await eventBus.publish([anEventOfACreatedResource()]);

      expect(hasEnded).toBe(true);
    });

    it('should reach the other handlers when one of them throws, and reject', async () => {
      const reached: string[] = [];
      eventBus.subscribe(
        aHandlerOf([TextResourceCreatedDomainEvent], () =>
          Promise.reject(new Error('the handler broke'))
        )
      );
      eventBus.subscribe(
        aHandlerOf([TextResourceCreatedDomainEvent], async event => {
          reached.push(event.aggregateId);
        })
      );
      const event = anEventOfACreatedResource();

      await expect(eventBus.publish([event])).rejects.toThrow();
      expect(reached).toStrictEqual([event.aggregateId]);
    });

    it('should leave no unhandled rejection when the publisher does not wait', async () => {
      const unhandled: unknown[] = [];
      const onUnhandledRejection = (reason: unknown): void => {
        unhandled.push(reason);
      };
      process.on('unhandledRejection', onUnhandledRejection);
      eventBus.subscribe(
        aHandlerOf([TextResourceCreatedDomainEvent], () =>
          Promise.reject(new Error('the handler broke'))
        )
      );

      void eventBus.publish([anEventOfACreatedResource()]);
      await aTick();
      await aTick();
      process.off('unhandledRejection', onUnhandledRejection);

      expect(unhandled).toStrictEqual([]);
    });

    it('should take an event that nobody subscribes to', async () => {
      await expect(
        eventBus.publish([anEventOfACreatedResource()])
      ).resolves.toBeUndefined();
    });
  });
});
