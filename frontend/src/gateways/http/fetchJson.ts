import type {SessionHeaders} from 'contract/SessionHeaders';
import {fetchOrRefuse} from '@/gateways/http/fetchOrRefuse';

export const fetchJson = async <Body>(
  path: string,
  sessionHeaders: SessionHeaders,
  init?: Omit<RequestInit, 'headers'>
): Promise<Body> =>
  (await (await fetchOrRefuse(path, sessionHeaders, init)).json()) as Body;
