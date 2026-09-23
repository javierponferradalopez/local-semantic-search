import {TextResourceCreated} from '../../../../../src/core/resources/domain/events/TextResourceCreated';
import {TextResourceDeleted} from '../../../../../src/core/resources/domain/events/TextResourceDeleted';
import {InProcessEventBus} from '../../../../../src/core/shared/infrastructure/InProcessEventBus';
import {StringMother} from '../../../../utils/object-mother/StringMother';

const anEventOfACreatedResource = (): TextResourceCreated => {
  const aggregateId = StringMother.randomUuid();

  return new TextResourceCreated({
    aggregateId,
    contentType: 'markdown',
    fileKey: `resources/${aggregateId}/the notes.md`
  });
};

describe('InProcessEventBus', () => {
  let eventBus: InProcessEventBus;

  beforeEach(() => {
    eventBus = new InProcessEventBus();
  });

  describe('#publish', () => {
    it('should give the event to the subscribers of its kind alone', async () => {
      const ofAdded: string[] = [];
      const ofDeleted: string[] = [];
      eventBus.subscribe(TextResourceCreated, async event => {
        ofAdded.push(event.aggregateId);
      });
      eventBus.subscribe(TextResourceDeleted, async event => {
        ofDeleted.push(event.aggregateId);
      });
      const event = anEventOfACreatedResource();

      await eventBus.publish([event]);
      await Promise.resolve();

      expect(ofAdded).toStrictEqual([event.aggregateId]);
      expect(ofDeleted).toStrictEqual([]);
    });

    it('should not wait for a subscriber that is still working', async () => {
      let hasEnded = false;
      eventBus.subscribe(TextResourceCreated, async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
        hasEnded = true;
      });

      await eventBus.publish([anEventOfACreatedResource()]);

      expect(hasEnded).toBe(false);
    });

    it('should keep the other subscribers when one of them throws', async () => {
      const reached: string[] = [];
      eventBus.subscribe(TextResourceCreated, () =>
        Promise.reject(new Error('the subscriber broke'))
      );
      eventBus.subscribe(TextResourceCreated, async event => {
        reached.push(event.aggregateId);
      });
      const event = anEventOfACreatedResource();

      await eventBus.publish([event]);
      await Promise.resolve();

      expect(reached).toStrictEqual([event.aggregateId]);
    });

    it('should take an event that nobody subscribes to', async () => {
      await expect(
        eventBus.publish([anEventOfACreatedResource()])
      ).resolves.toBeUndefined();
    });
  });
});
