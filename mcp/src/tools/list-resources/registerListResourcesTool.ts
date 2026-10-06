import type {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import type {CallToolResult} from '@modelcontextprotocol/sdk/types.js';
import {BackendUnavailable} from '../../gateways/BackendUnavailable';
import {Refusal} from '../../gateways/Refusal';
import type {ServerDependencies} from '../../server/createServer';
import {presentFailure} from '../presentFailure';
import {presentListResources} from './presentListResources';

const DESCRIPTION = [
  'Lists the files of the user that this product can search, each with its name, its content type, its ingest state, its creation date and a link that opens its file.',
  'Only a file in the state `ready` is searchable. A file in the state `ingesting` is not searchable yet. A file in the state `failed` comes with the code of its reason, so tell the user why it was not ingested.',
  'Call this tool when the user asks which files they have, or to know if a file is still `ingesting`.'
].join(' ');

export const registerListResourcesTool = (
  server: McpServer,
  {gateways, backendUrl}: ServerDependencies
): void => {
  server.registerTool(
    'list_resources',
    {
      title: 'List the Resources',
      description: DESCRIPTION,
      annotations: {readOnlyHint: true}
    },
    async (): Promise<CallToolResult> => {
      try {
        return presentListResources(await gateways.resources.list(), backendUrl);
      } catch (error) {
        if (error instanceof Refusal || error instanceof BackendUnavailable) {
          return presentFailure(error);
        }

        throw error;
      }
    }
  );
};
