import {fetchOrRefuse} from './fetchOrRefuse';

export const fetchJson = async <Body>(backendUrl: string, path: string): Promise<Body> =>
  (await (await fetchOrRefuse(backendUrl, path)).json()) as Body;
