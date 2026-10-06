import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import type {ResourceGateway} from '../gateways/ResourceGateway';
import {registerListResourcesTool} from '../tools/list-resources/registerListResourcesTool';

export type Gateways = {resources: ResourceGateway};

export type ServerDependencies = {gateways: Gateways; backendUrl: string};

export const createServer = (dependencies: ServerDependencies): McpServer => {
  const server = new McpServer({name: 'local-semantic-search', version: '0.0.0'});

  registerListResourcesTool(server, dependencies);

  return server;
};
