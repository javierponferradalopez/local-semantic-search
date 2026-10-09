import {ValueObjectError} from '../../../../../../src/core/shared/domain/errors/ValueObjectError';
import {Session} from '../../../../../../src/core/shared/domain/value-objects/Session';
import {StringMother} from '../../../../../utils/object-mother/StringMother';

describe('Session', () => {
  describe('.of', () => {
    it('should take a UUID and an Origin', () => {
      const id = StringMother.randomUuid();

      const session = Session.of({id, origin: 'interface'});

      expect(session.id.value).toBe(id);
      expect(session.origin.value).toBe('interface');
    });

    it('should refuse an identifier that is no UUID', () => {
      expect(() => Session.of({id: 'a-session', origin: 'mcp'})).toThrow(
        ValueObjectError
      );
    });

    it('should refuse an Origin that is neither mcp nor interface', () => {
      expect(() => Session.of({id: StringMother.randomUuid(), origin: 'agent'})).toThrow(
        ValueObjectError
      );
    });
  });
});
