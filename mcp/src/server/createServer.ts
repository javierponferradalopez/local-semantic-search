import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';

export type Gateways = Record<never, never>;

export type ServerDependencies = {gateways: Gateways; backendUrl: string};

export const createServer = (_dependencies: ServerDependencies): McpServer =>
  new McpServer({name: 'local-semantic-search', version: '0.0.0'});
