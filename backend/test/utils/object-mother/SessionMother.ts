import type {Origin} from 'contract/Origin';
import {Session} from '../../../src/core/shared/domain/value-objects/Session';
import {StringMother} from './StringMother';

export const SessionMother = {
  random(origin: Origin = 'mcp'): Session {
    return Session.of({id: StringMother.randomUuid(), origin});
  }
};
