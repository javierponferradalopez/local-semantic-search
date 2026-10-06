import {Client} from '@modelcontextprotocol/sdk/client/index.js';
import {InMemoryTransport} from '@modelcontextprotocol/sdk/inMemory.js';
import type {ResourceGateway} from '../../src/gateways/ResourceGateway';
import {createServer, type Gateways} from '../../src/server/createServer';
import {mock} from '../utils/mock';

type Params = {gateways: Partial<Gateways>; backendUrl: string};

export const connectAClient = async ({gateways, backendUrl}: Params): Promise<Client> => {
  const server = createServer({
    gateways: {resources: mock<ResourceGateway>(), ...gateways},
    backendUrl
  });
  const client = new Client({name: 'test', version: '0.0.0'});
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

  await server.connect(serverTransport);
  await client.connect(clientTransport);
  onTestFinished(() => client.close());

  return client;
};
