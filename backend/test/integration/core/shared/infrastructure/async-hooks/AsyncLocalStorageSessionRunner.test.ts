import {NoSessionError} from '../../../../../../src/core/shared/domain/errors/NoSessionError';
import {AsyncLocalStorageSessionRunner} from '../../../../../../src/core/shared/infrastructure/async-hooks/AsyncLocalStorageSessionRunner';
import {SessionMother} from '../../../../../utils/object-mother/SessionMother';

const aTick = (): Promise<void> => new Promise(resolve => setImmediate(resolve));

describe('AsyncLocalStorageSessionRunner', () => {
  describe('#run', () => {
    it('should give what the work gives', () => {
      const sessionRunner = new AsyncLocalStorageSessionRunner();

      expect(sessionRunner.run(SessionMother.random(), () => 'the result')).toBe(
        'the result'
      );
    });
  });

  describe('#current', () => {
    it('should give the Session that is open around the work', () => {
      const sessionRunner = new AsyncLocalStorageSessionRunner();
      const session = SessionMother.random();

      expect(sessionRunner.run(session, () => sessionRunner.current())).toBe(session);
    });

    it('should give the Session also after the work waits', async () => {
      const sessionRunner = new AsyncLocalStorageSessionRunner();
      const session = SessionMother.random();

      const current = await sessionRunner.run(session, async () => {
        await aTick();

        return sessionRunner.current();
      });

      expect(current).toBe(session);
    });

    it('should give to each work its own Session when two run at the same time', async () => {
      const sessionRunner = new AsyncLocalStorageSessionRunner();
      const first = SessionMother.random('mcp');
      const second = SessionMother.random('interface');
      const currentAfterATick = async (): Promise<unknown> => {
        await aTick();

        return sessionRunner.current();
      };

      const currents = await Promise.all([
        sessionRunner.run(first, currentAfterATick),
        sessionRunner.run(second, currentAfterATick)
      ]);

      expect(currents).toStrictEqual([first, second]);
    });

    it('should throw NoSessionError when no Session is open', () => {
      const sessionRunner = new AsyncLocalStorageSessionRunner();

      expect(() => sessionRunner.current()).toThrow(NoSessionError);
    });

    it('should throw NoSessionError after the work ends', () => {
      const sessionRunner = new AsyncLocalStorageSessionRunner();

      sessionRunner.run(SessionMother.random(), () => undefined);

      expect(() => sessionRunner.current()).toThrow(NoSessionError);
    });
  });
});
