import type {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import type {CallToolResult} from '@modelcontextprotocol/sdk/types.js';
import type {ImageResult} from 'contract/ImageResult';
import {BackendUnavailable} from '../../gateways/BackendUnavailable';
import {Refusal} from '../../gateways/Refusal';
import type {SearchGateway, Thumbnail} from '../../gateways/SearchGateway';
import type {ServerDependencies} from '../../server/createServer';
import {presentFailure} from '../presentFailure';
import {queryField} from '../queryField';
import {type PictureResult, presentSearch} from './presentSearch';

const DESCRIPTION = [
  'Searches the files of the user by meaning, and gives the Results in two separate groups: Text and Picture.',
  'Each Text Result gives the name of its file, its resource id, its content type, the passage that matched, the page when the file has pages, and a link that opens the file.',
  'Each Picture Result gives the name of its file, a link that opens it, and a thumbnail of the Picture.',
  'Call this tool when the user asks a question about their own content.',
  'A Result can be on a near subject and not answer the question: read its text, and ignore a Result that does not answer.',
  'To read more of the file of a Text Result, call `get_matches` with its resource id.',
  'When you answer, cite the name of the file and the page.',
  'When no text answers the question, say that you did not find the answer, and do not answer from what you know.'
].join(' ');

export const registerSearchTool = (
  server: McpServer,
  {gateways, backendUrl}: ServerDependencies
): void => {
  server.registerTool(
    'search',
    {
      title: 'Search the Resources',
      description: DESCRIPTION,
      inputSchema: {
        query: queryField.describe(
          'What to look for, in the words of the question. Any language. Send it again with other words when the Results do not answer.'
        )
      },
      annotations: {readOnlyHint: true}
    },
    async ({query}): Promise<CallToolResult> => {
      try {
        const {text, images} = await gateways.search.search(query);
        const pictures = await Promise.all(
          images.map(result => withItsThumbnail(result, gateways.search))
        );

        return presentSearch({text, pictures}, backendUrl);
      } catch (error) {
        if (error instanceof Refusal || error instanceof BackendUnavailable) {
          return presentFailure(error);
        }

        throw error;
      }
    }
  );
};

const withItsThumbnail = async (
  result: ImageResult,
  search: SearchGateway
): Promise<PictureResult> => {
  const thumbnail = await thumbnailOrNothing(result.thumbnailUrl, search);

  return thumbnail?.mediaType.startsWith('image/') ? {result, thumbnail} : {result};
};

const thumbnailOrNothing = async (
  thumbnailUrl: string,
  search: SearchGateway
): Promise<Thumbnail | undefined> => {
  try {
    return await search.thumbnail(thumbnailUrl);
  } catch (error) {
    if (error instanceof Refusal || error instanceof BackendUnavailable) {
      return undefined;
    }

    throw error;
  }
};
