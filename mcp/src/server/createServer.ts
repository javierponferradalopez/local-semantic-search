import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import type {ResourceGateway} from '../gateways/ResourceGateway';
import type {SearchGateway} from '../gateways/SearchGateway';
import {registerGetMatchesTool} from '../tools/get-matches/registerGetMatchesTool';
import {registerListResourcesTool} from '../tools/list-resources/registerListResourcesTool';
import {registerSearchTool} from '../tools/search/registerSearchTool';

export type Gateways = {search: SearchGateway; resources: ResourceGateway};

export type ServerDependencies = {gateways: Gateways; backendUrl: string};

export const createServer = (dependencies: ServerDependencies): McpServer => {
  const server = new McpServer({name: 'local-semantic-search', version: '0.0.0'});

  registerSearchTool(server, dependencies);
  registerGetMatchesTool(server, dependencies);
  registerListResourcesTool(server, dependencies);

  return server;
};
