import {ORIGINS} from 'contract/Origin';
import {ValueObjectError} from '../../../../../../src/core/shared/domain/errors/ValueObjectError';
import {Origin} from '../../../../../../src/core/shared/domain/value-objects/Origin';

describe('Origin', () => {
  describe('.of', () => {
    it.each([...ORIGINS])('should take %s', value => {
      expect(Origin.of({value}).value).toBe(value);
    });

    it.each(['', 'MCP', 'Interface', 'agent', 'person'])(
      'should refuse %j, which is no Origin',
      value => {
        expect(() => Origin.of({value})).toThrow(ValueObjectError);
      }
    );
  });
});
