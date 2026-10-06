import {StdioServerTransport} from '@modelcontextprotocol/sdk/server/stdio.js';
import {env} from './env';
import {createServer} from './server/createServer';

const server = createServer({gateways: {}, backendUrl: env.backend.url});

await server.connect(new StdioServerTransport());

console.error(`local-semantic-search calls the backend at ${env.backend.url}`);
