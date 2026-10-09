import type {ErrorItem} from 'contract/ErrorItem';
import type {SessionHeaders} from 'contract/SessionHeaders';
import {BackendUnavailable} from '../BackendUnavailable';
import {Refusal} from '../Refusal';

export const fetchOrRefuse = async (
  backendUrl: string,
  path: string,
  sessionHeaders: SessionHeaders
): Promise<Response> => {
  const response = await fetch(new URL(path, backendUrl), {
    headers: sessionHeaders
  }).catch(cause => {
    throw new BackendUnavailable(backendUrl, {cause});
  });

  if (!response.ok) {
    throw new Refusal(await itemsOf(response));
  }

  return response;
};

const itemsOf = async (response: Response): Promise<ErrorItem[]> => {
  const body = (await response.json().catch(() => undefined)) as
    | {errors?: unknown}
    | undefined;
  const errors = body?.errors;

  return Array.isArray(errors) ? (errors as ErrorItem[]) : [];
};
