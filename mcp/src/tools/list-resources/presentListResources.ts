import type {CallToolResult} from '@modelcontextprotocol/sdk/types.js';
import type {GetResourcesResponse} from 'contract/GetResourcesResponse';
import type {ResourceRow} from 'contract/ResourceRow';

export const presentListResources = (
  rows: GetResourcesResponse,
  backendUrl: string
): CallToolResult => ({
  content: [{type: 'text', text: textOf(rows, backendUrl)}]
});

const textOf = (rows: GetResourcesResponse, backendUrl: string): string => {
  if (rows.length === 0) {
    return 'There is no Resource. The user creates one when they upload a File in the frontend.';
  }

  return rows.map(row => resourceTextOf(row, backendUrl)).join('\n\n');
};

const resourceTextOf = (row: ResourceRow, backendUrl: string): string =>
  [
    `- ${row.name}`,
    `  Content type: ${row.contentType}`,
    `  Ingest state: ${row.ingestState}`,
    ...(row.reason === undefined ? [] : [`  Reason: ${row.reason}`]),
    `  Created at: ${row.createdAt}`,
    `  File: ${new URL(row.fileUrl, backendUrl)}`
  ].join('\n');
