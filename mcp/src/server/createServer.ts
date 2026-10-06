import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';

export const createServer = (): McpServer =>
  new McpServer({name: 'local-semantic-search', version: '0.0.0'});
