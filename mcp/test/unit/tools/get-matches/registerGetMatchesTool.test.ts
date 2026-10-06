import type {Client} from '@modelcontextprotocol/sdk/client/index.js';
import type {CallToolResult} from '@modelcontextprotocol/sdk/types.js';
import {BackendUnavailable} from '../../../../src/gateways/BackendUnavailable';
import {Refusal} from '../../../../src/gateways/Refusal';
import type {SearchGateway} from '../../../../src/gateways/SearchGateway';
import {connectAClient} from '../../../lib/connectAClient';
import {type MockProxy, mock} from '../../../utils/mock';

const BACKEND_URL = 'http://localhost:3000';

const RESOURCE_ID = '0b1c2d3e-0000-4000-8000-000000000001';

const textOf = (result: CallToolResult): string =>
  result.content.map(block => (block.type === 'text' ? block.text : '')).join('\n');

describe('get_matches', () => {
  let search: MockProxy<SearchGateway>;
  let client: Client;

  const getMatches = async (args: Record<string, unknown>): Promise<CallToolResult> =>
    (await client.callTool({name: 'get_matches', arguments: args})) as CallToolResult;

  beforeEach(async () => {
    search = mock<SearchGateway>();
    search.matches.mockResolvedValue([]);
    client = await connectAClient({gateways: {search}, backendUrl: BACKEND_URL});
  });

  it('should be read-only and take a resource id and a query, each described', async () => {
    const {tools} = await client.listTools();
    const tool = tools.find(({name}) => name === 'get_matches');
    const properties = (tool?.inputSchema.properties ?? {}) as Record<
      string,
      {description?: string}
    >;

    expect(tool?.annotations?.readOnlyHint).toBe(true);
    expect(Object.keys(properties)).toEqual(['resourceId', 'query']);
    expect(tool?.inputSchema.required).toEqual(['resourceId', 'query']);
    expect(properties.resourceId.description).toContain('search');
    expect(properties.query.description).toMatch(/other words/);
  });

  it('should tell the agent that it works on a Text Resource and that a Match can be on a near subject, with no word of a score', async () => {
    const {tools} = await client.listTools();
    const description = tools.find(({name}) => name === 'get_matches')?.description ?? '';

    expect(description).toMatch(/Text Result/);
    expect(description).toMatch(/not on a Picture Result/);
    expect(description).toMatch(/near subject/);
    expect(description).toMatch(/other words/);
    expect(description).toContain('search');
    expect(description).not.toMatch(/score|floor|margin|rerank/i);
  });

  it('should give the text of each Match, best first, and the page when there is one', async () => {
    search.matches.mockResolvedValue([
      {text: 'The octopus has eight arms.', page: 3},
      {text: 'Each arm has suckers.'}
    ]);

    const result = await getMatches({resourceId: RESOURCE_ID, query: 'octopus arms'});

    expect(result.isError).toBeFalsy();
    expect(textOf(result)).toBe(
      [
        'Matches in this Resource, best first:',
        '',
        '- Match 1, page 3:',
        '    The octopus has eight arms.',
        '',
        '- Match 2:',
        '    Each arm has suckers.'
      ].join('\n')
    );
    expect(search.matches).toHaveBeenCalledWith(RESOURCE_ID, 'octopus arms');
  });

  it('should indent each line of the text of a Match', async () => {
    search.matches.mockResolvedValue([{text: '# Arms\n\n- eight'}]);

    const result = await getMatches({resourceId: RESOURCE_ID, query: 'octopus arms'});

    expect(textOf(result)).toContain('- Match 1:\n    # Arms\n    \n    - eight');
  });

  it('should show each Match that the backend gives, and cut nothing', async () => {
    search.matches.mockResolvedValue(
      Array.from({length: 12}, (_, index) => ({text: `Passage ${index + 1}.`}))
    );

    const result = await getMatches({resourceId: RESOURCE_ID, query: 'octopus arms'});

    expect(textOf(result).match(/^- Match \d+/gm)).toHaveLength(12);
    expect(textOf(result)).toContain('- Match 12:\n    Passage 12.');
  });

  it('should say that nothing in this Resource answers and to try other words, with no error', async () => {
    const result = await getMatches({resourceId: RESOURCE_ID, query: 'octopus arms'});

    expect(result.isError).toBeFalsy();
    expect(textOf(result)).toMatch(/Nothing in this Resource answers this Query/);
    expect(textOf(result)).toMatch(/other words or another language/);
    expect(textOf(result)).toContain('search');
  });

  it.each([
    ['an empty query', {resourceId: RESOURCE_ID, query: ''}, /query/],
    ['a query of only spaces', {resourceId: RESOURCE_ID, query: ' \t\n'}, /query/],
    ['no query', {resourceId: RESOURCE_ID}, /query/],
    [
      'a resource id that is not a UUID',
      {resourceId: 'report.pdf', query: 'octopus'},
      /resourceId/
    ],
    ['no resource id', {query: 'octopus'}, /resourceId/]
  ])('should refuse %s, and not get the Matches', async (_case, args, field) => {
    const result = await getMatches(args);

    expect(result.isError).toBe(true);
    expect(textOf(result)).toMatch(field);
    expect(search.matches).not.toHaveBeenCalled();
  });

  it.each([
    [
      'a query of only spaces',
      {resourceId: RESOURCE_ID, query: '   '},
      'The query must have at least one character that is not a space'
    ],
    [
      'a resource id that is not a UUID',
      {resourceId: 'report.pdf', query: 'octopus'},
      'The resource id must be a UUID'
    ]
  ])('should say why it refuses %s', async (_case, args, message) => {
    expect(textOf(await getMatches(args))).toContain(message);
  });

  it('should give an error with resource_not_found when the Resource does not exist', async () => {
    search.matches.mockRejectedValue(
      new Refusal([{code: 'resource_not_found', params: {resourceId: RESOURCE_ID}}])
    );

    const result = await getMatches({resourceId: RESOURCE_ID, query: 'octopus'});

    expect(result.isError).toBe(true);
    expect(textOf(result)).toContain(
      `- resource_not_found {"resourceId":"${RESOURCE_ID}"}`
    );
  });

  it('should give an error that names BACKEND_URL and pnpm dev when the backend is unavailable', async () => {
    search.matches.mockRejectedValue(new BackendUnavailable(BACKEND_URL));

    const result = await getMatches({resourceId: RESOURCE_ID, query: 'octopus'});

    expect(result.isError).toBe(true);
    expect(textOf(result)).toContain('BACKEND_URL');
    expect(textOf(result)).toContain('pnpm dev');
  });

  it('should give the message of an error that is not a failure of the backend', async () => {
    search.matches.mockRejectedValue(new Error('An unexpected error'));

    const result = await getMatches({resourceId: RESOURCE_ID, query: 'octopus'});

    expect(result.isError).toBe(true);
    expect(textOf(result)).toContain('An unexpected error');
  });
});
