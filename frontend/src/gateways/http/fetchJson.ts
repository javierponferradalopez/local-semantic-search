import {fetchOrRefuse} from '@/gateways/http/fetchOrRefuse';

export const fetchJson = async <Body>(path: string, init?: RequestInit): Promise<Body> =>
  (await (await fetchOrRefuse(path, init)).json()) as Body;
