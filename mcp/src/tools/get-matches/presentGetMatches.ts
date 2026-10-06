import type {CallToolResult} from '@modelcontextprotocol/sdk/types.js';
import type {GetMatchesResponse} from 'contract/GetMatchesResponse';
import type {MatchRow} from 'contract/MatchRow';

export const presentGetMatches = (matches: GetMatchesResponse): CallToolResult => ({
  content: [{type: 'text', text: textOf(matches)}]
});

const textOf = (matches: GetMatchesResponse): string => {
  if (matches.length === 0) {
    return [
      'Nothing in this Resource answers this Query.',
      'Try other words or another language,',
      'or call `search` to find another Resource.'
    ].join(' ');
  }

  return ['Matches in this Resource, best first:', ...matches.map(matchTextOf)].join(
    '\n\n'
  );
};

const matchTextOf = ({text, page}: MatchRow, index: number): string =>
  [
    `- Match ${index + 1}${page === undefined ? '' : `, page ${page}`}:`,
    ...text.split('\n').map(line => `    ${line}`)
  ].join('\n');
