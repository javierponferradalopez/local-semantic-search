import type {CallToolResult} from '@modelcontextprotocol/sdk/types.js';
import type {ImageResult} from 'contract/ImageResult';
import type {SearchResponse} from 'contract/SearchResponse';
import type {TextResult} from 'contract/TextResult';

export const presentSearch = (
  {text, images}: SearchResponse,
  backendUrl: string
): CallToolResult => ({
  content: [
    {
      type: 'text',
      text: groupTextOf(
        'Text',
        text.map(result => textResultOf(result, backendUrl))
      )
    },
    {
      type: 'text',
      text: groupTextOf(
        'Picture',
        images.map(result => imageResultOf(result, backendUrl))
      )
    }
  ]
});

const groupTextOf = (group: 'Text' | 'Picture', results: string[]): string => {
  if (results.length === 0) {
    return [
      `The Search found no ${group} Result.`,
      'Try other words or another language,',
      'or call `list_resources` to see if a file is still `ingesting`.'
    ].join(' ');
  }

  return [`Results of the ${group} group:`, ...results].join('\n\n');
};

const textResultOf = (result: TextResult, backendUrl: string): string =>
  [
    `- ${result.name}`,
    `  Resource id: ${result.resourceId}`,
    `  Content type: ${result.contentType}`,
    ...(result.page === undefined ? [] : [`  Page: ${result.page}`]),
    `  File: ${new URL(result.fileUrl, backendUrl)}`,
    '  Match:',
    ...result.text.split('\n').map(line => `    ${line}`)
  ].join('\n');

const imageResultOf = (result: ImageResult, backendUrl: string): string =>
  [`- ${result.name}`, `  File: ${new URL(result.fileUrl, backendUrl)}`].join('\n');
