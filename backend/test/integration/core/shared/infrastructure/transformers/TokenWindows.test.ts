import {TokenWindows} from '../../../../../../src/core/shared/infrastructure/transformers/TokenWindows';

const idsOf = (count: number): number[] =>
  Array.from({length: count}, (_, index) => index);

describe('TokenWindows', () => {
  describe('.of', () => {
    it('should give one empty window for no ids', () => {
      expect(TokenWindows.of([], 63)).toStrictEqual([[]]);
    });

    it('should give one window for ids that fill the size', () => {
      expect(TokenWindows.of(idsOf(63), 63)).toStrictEqual([idsOf(63)]);
    });

    it('should give two windows of almost one length for one id more than the size', () => {
      const windows = TokenWindows.of(idsOf(64), 63);

      expect(windows.map(window => window.length)).toStrictEqual([32, 32]);
    });

    it('should keep each id once, in its order', () => {
      const ids = idsOf(1000);

      const windows = TokenWindows.of(ids, 63);

      expect(windows.flat()).toStrictEqual(ids);
      expect(Math.max(...windows.map(window => window.length))).toBeLessThanOrEqual(63);
    });
  });
});
