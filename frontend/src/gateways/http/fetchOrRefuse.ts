import type {ErrorItem} from 'contract/ErrorItem';
import type {SessionHeaders} from 'contract/SessionHeaders';
import {Refusal} from '@/gateways/Refusal';

export const fetchOrRefuse = async (
  path: string,
  sessionHeaders: SessionHeaders,
  init?: Omit<RequestInit, 'headers'>
): Promise<Response> => {
  const response = await fetch(path, {...init, headers: sessionHeaders});

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
