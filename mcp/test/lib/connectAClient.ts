import {Client} from '@modelcontextprotocol/sdk/client/index.js';
import {InMemoryTransport} from '@modelcontextprotocol/sdk/inMemory.js';
import {createServer, type Gateways} from '../../src/server/createServer';

type Params = {gateways: Gateways; backendUrl: string};

export const connectAClient = async ({gateways, backendUrl}: Params): Promise<Client> => {
  const server = createServer({gateways, backendUrl});
  const client = new Client({name: 'test', version: '0.0.0'});
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

  await server.connect(serverTransport);
  await client.connect(clientTransport);
  onTestFinished(() => client.close());

  return client;
};
