import {connectAClient} from '../../lib/connectAClient';

describe('connectAClient', () => {
  it('should connect a client to the server of local-semantic-search', async () => {
    const client = await connectAClient({
      gateways: {},
      backendUrl: 'http://localhost:3000'
    });

    expect(client.getServerVersion()?.name).toBe('local-semantic-search');
  });
});
