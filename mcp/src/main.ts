import {randomUUID} from 'node:crypto';
import {StdioServerTransport} from '@modelcontextprotocol/sdk/server/stdio.js';
import type {SessionHeaders} from 'contract/SessionHeaders';
import {env} from './env';
import {HttpResourceGateway} from './gateways/http/HttpResourceGateway';
import {HttpSearchGateway} from './gateways/http/HttpSearchGateway';
import {createServer} from './server/createServer';

// One stdio process is one conversation of an agent, so one Session (ADR-0047).
const sessionHeaders: SessionHeaders = {
  'Session-Id': randomUUID(),
  'Session-Origin': 'mcp'
};

const server = createServer({
  gateways: {
    search: new HttpSearchGateway({backendUrl: env.backend.url, sessionHeaders}),
    resources: new HttpResourceGateway({backendUrl: env.backend.url, sessionHeaders})
  },
  backendUrl: env.backend.url
});

await server.connect(new StdioServerTransport());

console.error(`local-semantic-search calls the backend at ${env.backend.url}`);
