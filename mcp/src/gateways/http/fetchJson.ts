import type {SessionHeaders} from 'contract/SessionHeaders';
import {fetchOrRefuse} from './fetchOrRefuse';

export const fetchJson = async <Body>(
  backendUrl: string,
  path: string,
  sessionHeaders: SessionHeaders
): Promise<Body> =>
  (await (await fetchOrRefuse(backendUrl, path, sessionHeaders)).json()) as Body;
