import type {ErrorItem} from 'contract/ErrorItem';
import {Refusal} from '@/gateways/Refusal';

export const fetchOrRefuse = async (
  path: string,
  init?: RequestInit
): Promise<Response> => {
  const response = await fetch(path, init);

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
