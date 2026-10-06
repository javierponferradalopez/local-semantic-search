import type {CallToolResult} from '@modelcontextprotocol/sdk/types.js';
import {BackendUnavailable} from '../gateways/BackendUnavailable';
import type {Refusal} from '../gateways/Refusal';

export const presentFailure = (
  failure: Refusal | BackendUnavailable
): CallToolResult => ({
  isError: true,
  content: [{type: 'text', text: textOf(failure)}]
});

const textOf = (failure: Refusal | BackendUnavailable): string => {
  if (failure instanceof BackendUnavailable) {
    return [
      `The backend at ${failure.address} (BACKEND_URL) does not answer.`,
      'It is not started, or it is still loading its models.',
      'Tell the user to start the backend with `pnpm dev`, then call this tool again.'
    ].join(' ');
  }

  return [
    'The backend refused the request with these codes:',
    ...failure.items.map(({code, params}) => `- ${code} ${JSON.stringify(params)}`)
  ].join('\n');
};
