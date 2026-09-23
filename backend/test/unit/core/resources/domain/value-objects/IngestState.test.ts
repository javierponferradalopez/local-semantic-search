import {INGEST_STATES} from 'contract/IngestState';
import {IngestState} from '../../../../../../src/core/resources/domain/value-objects/IngestState';
import {ValueObjectError} from '../../../../../../src/core/shared/domain/errors/ValueObjectError';

describe('IngestState', () => {
  describe('.of', () => {
    it.each([...INGEST_STATES])('should take %s', value => {
      expect(IngestState.of({value}).value).toBe(value);
    });

    it.each(['', 'Ingesting', 'done', 'pending'])(
      'should refuse %j, which is no Ingest state',
      value => {
        expect(() => IngestState.of({value})).toThrow(ValueObjectError);
      }
    );
  });

  describe('.ingesting', () => {
    it('should give a state that is Ingesting and is not Failed', () => {
      const ingestState = IngestState.ingesting();

      expect(ingestState.value).toBe('ingesting');
      expect(ingestState.isIngesting()).toBe(true);
      expect(ingestState.isFailed()).toBe(false);
    });
  });

  describe('.ready', () => {
    it('should give a state that is neither Ingesting nor Failed', () => {
      const ingestState = IngestState.ready();

      expect(ingestState.value).toBe('ready');
      expect(ingestState.isIngesting()).toBe(false);
      expect(ingestState.isFailed()).toBe(false);
    });
  });

  describe('.failed', () => {
    it('should give a state that is Failed and is not Ingesting', () => {
      const ingestState = IngestState.failed();

      expect(ingestState.value).toBe('failed');
      expect(ingestState.isFailed()).toBe(true);
      expect(ingestState.isIngesting()).toBe(false);
    });
  });
});
