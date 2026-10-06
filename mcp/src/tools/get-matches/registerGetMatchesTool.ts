import type {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import type {CallToolResult} from '@modelcontextprotocol/sdk/types.js';
import {z} from 'zod';
import {BackendUnavailable} from '../../gateways/BackendUnavailable';
import {Refusal} from '../../gateways/Refusal';
import type {ServerDependencies} from '../../server/createServer';
import {presentFailure} from '../presentFailure';
import {queryField} from '../queryField';
import {presentGetMatches} from './presentGetMatches';

const DESCRIPTION = [
  'Reads more of one file that the user has: gives the passages of that file that are nearest to the query, best first, each with its page when the file has pages.',
  'Call this tool after `search`, with the resource id of a Text Result that looks relevant, to read more of its file.',
  'It works only on the file of a Text Result, not on a Picture Result.',
  'You can use other words than in the search, to look in the same file for another aspect of the question.',
  'A Match can be on a near subject and not answer the question: read its text, and ignore a Match that does not answer.',
  'When you answer, cite the name of the file and the page.'
].join(' ');

export const registerGetMatchesTool = (
  server: McpServer,
  {gateways}: ServerDependencies
): void => {
  server.registerTool(
    'get_matches',
    {
      title: 'Read more of a Resource',
      description: DESCRIPTION,
      inputSchema: {
        resourceId: z
          .uuid('The resource id must be a UUID')
          .describe('The resource id of a Text Result that `search` gave.'),
        query: queryField.describe(
          'What to look for in this file. Any language. Send it again with other words when the Matches do not answer.'
        )
      },
      annotations: {readOnlyHint: true}
    },
    async ({resourceId, query}): Promise<CallToolResult> => {
      try {
        return presentGetMatches(await gateways.search.matches(resourceId, query));
      } catch (error) {
        if (error instanceof Refusal || error instanceof BackendUnavailable) {
          return presentFailure(error);
        }

        throw error;
      }
    }
  );
};
