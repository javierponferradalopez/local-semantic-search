import type {Client} from '@modelcontextprotocol/sdk/client/index.js';
import type {CallToolResult} from '@modelcontextprotocol/sdk/types.js';
import type {ImageResult} from 'contract/ImageResult';
import type {SearchResponse} from 'contract/SearchResponse';
import type {TextResult} from 'contract/TextResult';
import {BackendUnavailable} from '../../../../src/gateways/BackendUnavailable';
import {Refusal} from '../../../../src/gateways/Refusal';
import type {SearchGateway} from '../../../../src/gateways/SearchGateway';
import {connectAClient} from '../../../lib/connectAClient';
import {type MockProxy, mock} from '../../../utils/mock';

const BACKEND_URL = 'http://localhost:3000';

const textResultNamed = (name: string, fields: Partial<TextResult> = {}): TextResult => ({
  resourceId: `id-of-${name}`,
  name,
  contentType: 'markdown',
  text: `The text of ${name}.`,
  fileUrl: `/files/${name}`,
  ...fields
});

const imageResultNamed = (
  name: string,
  fields: Partial<ImageResult> = {}
): ImageResult => ({
  resourceId: `id-of-${name}`,
  name,
  fileUrl: `/files/${name}`,
  thumbnailUrl: `/thumbnails/${name}`,
  ...fields
});

const NO_RESULT: SearchResponse = {text: [], images: []};

const textsOf = (result: CallToolResult): string[] =>
  result.content.map(block => (block.type === 'text' ? block.text : ''));

const textOf = (result: CallToolResult): string => textsOf(result).join('\n');

describe('search', () => {
  let search: MockProxy<SearchGateway>;
  let client: Client;

  const searchFor = async (query: unknown): Promise<CallToolResult> =>
    (await client.callTool({name: 'search', arguments: {query}})) as CallToolResult;

  beforeEach(async () => {
    search = mock<SearchGateway>();
    search.search.mockResolvedValue(NO_RESULT);
    client = await connectAClient({gateways: {search}, backendUrl: BACKEND_URL});
  });

  it('should be read-only and take only a query', async () => {
    const {tools} = await client.listTools();
    const tool = tools.find(({name}) => name === 'search');

    expect(tool?.annotations?.readOnlyHint).toBe(true);
    expect(Object.keys(tool?.inputSchema.properties ?? {})).toEqual(['query']);
    expect(tool?.inputSchema.required).toEqual(['query']);
  });

  it('should tell the agent how to use the Results, with no word of a score', async () => {
    const {tools} = await client.listTools();
    const description = tools.find(({name}) => name === 'search')?.description ?? '';

    expect(description).toMatch(/near subject/);
    expect(description).toContain('get_matches');
    expect(description).toMatch(/cite/i);
    expect(description).toMatch(/did not find/);
    expect(description).not.toMatch(/score|floor|margin|rerank/i);
  });

  it('should send the Query as the agent wrote it', async () => {
    await searchFor('  patas de un pulpo ');

    expect(search.search).toHaveBeenCalledWith('  patas de un pulpo ');
  });

  it.each([
    ['empty', ''],
    ['only spaces', ' \t\n'],
    ['not a string', 42]
  ])('should refuse a query that is %s, and not search', async (_case, query) => {
    const result = await searchFor(query);

    expect(result.isError).toBe(true);
    expect(textOf(result)).toMatch(/query/);
    expect(search.search).not.toHaveBeenCalled();
  });

  it('should say why it refuses a query of only spaces', async () => {
    const result = await searchFor('   ');

    expect(textOf(result)).toContain(
      'The query must have at least one character that is not a space'
    );
  });

  it('should give the name, the Content type, the page, the File and the text of each Text Result', async () => {
    search.search.mockResolvedValue({
      text: [
        textResultNamed('report.pdf', {
          contentType: 'pdf',
          page: 3,
          text: 'The octopus has eight arms.'
        }),
        textResultNamed('notes.md', {text: 'Arms of an octopus.'})
      ],
      images: []
    });

    const [text] = textsOf(await searchFor('octopus arms'));

    expect(text).toBe(
      [
        'Results of the Text group:',
        '',
        '- report.pdf',
        '  Resource id: id-of-report.pdf',
        '  Content type: pdf',
        '  Page: 3',
        '  File: http://localhost:3000/files/report.pdf',
        '  Match:',
        '    The octopus has eight arms.',
        '',
        '- notes.md',
        '  Resource id: id-of-notes.md',
        '  Content type: markdown',
        '  File: http://localhost:3000/files/notes.md',
        '  Match:',
        '    Arms of an octopus.'
      ].join('\n')
    );
  });

  it('should indent each line of the text of a Match', async () => {
    search.search.mockResolvedValue({
      text: [textResultNamed('notes.md', {text: '# Arms\n\n- eight'})],
      images: []
    });

    const [text] = textsOf(await searchFor('octopus arms'));

    expect(text).toContain('  Match:\n    # Arms\n    \n    - eight');
  });

  it('should give the name and the File of each Picture Result, in its own group', async () => {
    search.search.mockResolvedValue({
      text: [textResultNamed('notes.md')],
      images: [imageResultNamed('octopus.png'), imageResultNamed('squid.webp')]
    });

    const result = await searchFor('octopus');

    expect(result.isError).toBeFalsy();
    expect(textsOf(result)[1]).toBe(
      [
        'Results of the Picture group:',
        '',
        '- octopus.png',
        '  File: http://localhost:3000/files/octopus.png',
        '',
        '- squid.webp',
        '  File: http://localhost:3000/files/squid.webp'
      ].join('\n')
    );
  });

  it('should show each Result that the backend gives, and cut nothing', async () => {
    const names = Array.from({length: 25}, (_, index) => `file-${index}.md`);
    search.search.mockResolvedValue({
      text: names.map(name => textResultNamed(name)),
      images: names.map(name => imageResultNamed(name.replace('.md', '.png')))
    });

    const [text, pictures] = textsOf(await searchFor('octopus'));

    expect(text.match(/^- /gm)).toHaveLength(25);
    expect(pictures.match(/^- /gm)).toHaveLength(25);
  });

  it('should resolve the File URL of each Result against BACKEND_URL', async () => {
    search.search.mockResolvedValue({
      text: [textResultNamed('notes.md', {fileUrl: '/files/an%20id/notes.md'})],
      images: [
        imageResultNamed('photo.png', {
          fileUrl: 'https://store.example/photo.png?signature=a'
        })
      ]
    });

    const text = textOf(await searchFor('octopus'));

    expect(text).toContain('  File: http://localhost:3000/files/an%20id/notes.md');
    expect(text).toContain('  File: https://store.example/photo.png?signature=a');
  });

  it('should say what to do next for each empty group, with no error', async () => {
    const result = await searchFor('octopus');

    expect(result.isError).toBeFalsy();
    const [text, pictures] = textsOf(result);
    for (const group of [text, pictures]) {
      expect(group).toMatch(/found no/);
      expect(group).toMatch(/other words or another language/);
      expect(group).toContain('list_resources');
      expect(group).toContain('ingesting');
    }
    expect(text).toMatch(/Text Result/);
    expect(pictures).toMatch(/Picture Result/);
  });

  it('should say that one group is empty when only the other found something', async () => {
    search.search.mockResolvedValue({
      text: [],
      images: [imageResultNamed('octopus.png')]
    });

    const [text, pictures] = textsOf(await searchFor('octopus'));

    expect(text).toMatch(/found no Text Result/);
    expect(pictures).toContain('- octopus.png');
  });

  it('should give an error that names BACKEND_URL and pnpm dev when the backend is unavailable', async () => {
    search.search.mockRejectedValue(new BackendUnavailable(BACKEND_URL));

    const result = await searchFor('octopus');

    expect(result.isError).toBe(true);
    expect(textOf(result)).toContain('BACKEND_URL');
    expect(textOf(result)).toContain(BACKEND_URL);
    expect(textOf(result)).toContain('pnpm dev');
  });

  it('should search on the next call when the backend is up again', async () => {
    search.search
      .mockRejectedValueOnce(new BackendUnavailable(BACKEND_URL))
      .mockResolvedValueOnce({text: [textResultNamed('notes.md')], images: []});

    await searchFor('octopus');
    const result = await searchFor('octopus');

    expect(result.isError).toBeFalsy();
    expect(textOf(result)).toContain('- notes.md');
  });

  it('should give an error with the codes and the params of a refusal', async () => {
    search.search.mockRejectedValue(
      new Refusal([{code: 'invalid_input', params: {path: 'q'}}])
    );

    const result = await searchFor('octopus');

    expect(result.isError).toBe(true);
    expect(textOf(result)).toContain('- invalid_input {"path":"q"}');
  });

  it('should give the message of an error that is not a failure of the backend', async () => {
    search.search.mockRejectedValue(new Error('An unexpected error'));

    const result = await searchFor('octopus');

    expect(result.isError).toBe(true);
    expect(textOf(result)).toContain('An unexpected error');
  });
});
