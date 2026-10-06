import {StdioServerTransport} from '@modelcontextprotocol/sdk/server/stdio.js';
import {env} from './env';
import {HttpResourceGateway} from './gateways/http/HttpResourceGateway';
import {createServer} from './server/createServer';

const server = createServer({
  gateways: {resources: new HttpResourceGateway({backendUrl: env.backend.url})},
  backendUrl: env.backend.url
});

await server.connect(new StdioServerTransport());

console.error(`local-semantic-search calls the backend at ${env.backend.url}`);
