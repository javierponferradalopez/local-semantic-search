import {AsyncLocalStorage} from 'node:async_hooks';
import {NoSessionError} from '../../domain/errors/NoSessionError';
import type {SessionRunner} from '../../domain/services/SessionRunner';
import type {Session} from '../../domain/value-objects/Session';

export class AsyncLocalStorageSessionRunner implements SessionRunner {
  private readonly openSession = new AsyncLocalStorage<Session>();

  public run<T>(session: Session, work: () => T): T {
    return this.openSession.run(session, work);
  }

  public current(): Session {
    const session = this.openSession.getStore();

    if (session === undefined) {
      throw NoSessionError.causeNoSessionIsOpen();
    }

    return session;
  }
}
