import type {Client} from '@modelcontextprotocol/sdk/client/index.js';
import type {CallToolResult} from '@modelcontextprotocol/sdk/types.js';
import type {ResourceRow} from 'contract/ResourceRow';
import {BackendUnavailable} from '../../../../src/gateways/BackendUnavailable';
import {Refusal} from '../../../../src/gateways/Refusal';
import type {ResourceGateway} from '../../../../src/gateways/ResourceGateway';
import {connectAClient} from '../../../lib/connectAClient';
import {type MockProxy, mock} from '../../../utils/mock';

const BACKEND_URL = 'http://localhost:3000';

const rowNamed = (name: string, fields: Partial<ResourceRow> = {}): ResourceRow => ({
  id: `id-of-${name}`,
  name,
  contentType: 'markdown',
  ingestState: 'ready',
  createdAt: '2026-10-01T10:00:00.000Z',
  fileUrl: `/files/${name}`,
  ...fields
});

const textOf = (result: CallToolResult): string =>
  result.content.map(block => (block.type === 'text' ? block.text : '')).join('\n');

describe('list_resources', () => {
  let resources: MockProxy<ResourceGateway>;
  let client: Client;

  const listResources = async (): Promise<CallToolResult> =>
    (await client.callTool({name: 'list_resources'})) as CallToolResult;

  beforeEach(async () => {
    resources = mock<ResourceGateway>();
    client = await connectAClient({gateways: {resources}, backendUrl: BACKEND_URL});
  });

  it('should be read-only and take no input', async () => {
    const {tools} = await client.listTools();
    const tool = tools.find(({name}) => name === 'list_resources');

    expect(tool?.annotations?.readOnlyHint).toBe(true);
    expect(tool?.inputSchema.properties ?? {}).toEqual({});
    expect(tool?.description).toBeTruthy();
  });

  it('should give the name, the Content type, the Ingest state and the creation date of each Resource', async () => {
    resources.list.mockResolvedValue([
      rowNamed('notes.md'),
      rowNamed('report.pdf', {
        contentType: 'pdf',
        ingestState: 'ingesting',
        createdAt: '2026-10-02T08:30:00.000Z'
      })
    ]);

    const result = await listResources();

    expect(result.isError).toBeFalsy();
    expect(textOf(result)).toBe(
      [
        '- notes.md',
        '  Content type: markdown',
        '  Ingest state: ready',
        '  Created at: 2026-10-01T10:00:00.000Z',
        '  File: http://localhost:3000/files/notes.md',
        '',
        '- report.pdf',
        '  Content type: pdf',
        '  Ingest state: ingesting',
        '  Created at: 2026-10-02T08:30:00.000Z',
        '  File: http://localhost:3000/files/report.pdf'
      ].join('\n')
    );
  });

  it('should resolve the File URL of each Resource against BACKEND_URL', async () => {
    resources.list.mockResolvedValue([
      rowNamed('notes.md', {fileUrl: '/files/an%20id/notes.md'}),
      rowNamed('photo.png', {fileUrl: 'https://store.example/photo.png?signature=a'})
    ]);

    const text = textOf(await listResources());

    expect(text).toContain('  File: http://localhost:3000/files/an%20id/notes.md');
    expect(text).toContain('  File: https://store.example/photo.png?signature=a');
  });

  it('should give the code of the Reason of a failed Resource', async () => {
    resources.list.mockResolvedValue([
      rowNamed('scan.pdf', {
        contentType: 'pdf',
        ingestState: 'failed',
        reason: 'no_text_found'
      })
    ]);

    const text = textOf(await listResources());

    expect(text).toContain('  Ingest state: failed\n  Reason: no_text_found');
  });

  it('should say that there is no Resource, with no error, when the list is empty', async () => {
    resources.list.mockResolvedValue([]);

    const result = await listResources();

    expect(result.isError).toBeFalsy();
    expect(textOf(result)).toMatch(/no Resource/);
  });

  it('should give an error that names BACKEND_URL and pnpm dev when the backend is unavailable', async () => {
    resources.list.mockRejectedValue(new BackendUnavailable(BACKEND_URL));

    const result = await listResources();

    expect(result.isError).toBe(true);
    expect(textOf(result)).toContain('BACKEND_URL');
    expect(textOf(result)).toContain(BACKEND_URL);
    expect(textOf(result)).toContain('pnpm dev');
  });

  it('should list the Resources on the next call when the backend is up again', async () => {
    resources.list
      .mockRejectedValueOnce(new BackendUnavailable(BACKEND_URL))
      .mockResolvedValueOnce([rowNamed('notes.md')]);

    await listResources();
    const result = await listResources();

    expect(result.isError).toBeFalsy();
    expect(textOf(result)).toContain('notes.md');
  });

  it('should give an error with the codes and the params of a refusal', async () => {
    resources.list.mockRejectedValue(
      new Refusal([{code: 'invalid_input', params: {path: 'q'}}])
    );

    const result = await listResources();

    expect(result.isError).toBe(true);
    expect(textOf(result)).toContain('- invalid_input {"path":"q"}');
  });
});
