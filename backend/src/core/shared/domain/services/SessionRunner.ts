import type {Session} from '../value-objects/Session';

export interface SessionRunner {
  run<T>(session: Session, work: () => T): T;
  // Throws NoSessionError outside run(): code that no request started has no Session.
  current(): Session;
}
