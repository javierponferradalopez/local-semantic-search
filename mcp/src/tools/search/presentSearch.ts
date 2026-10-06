import type {CallToolResult, ImageContent} from '@modelcontextprotocol/sdk/types.js';
import type {ImageResult} from 'contract/ImageResult';
import type {TextResult} from 'contract/TextResult';
import type {Thumbnail} from '../../gateways/SearchGateway';

type Block = CallToolResult['content'][number];

export type PictureResult = {result: ImageResult; thumbnail?: Thumbnail};

type Groups = {text: TextResult[]; pictures: PictureResult[]};

export const presentSearch = (
  {text, pictures}: Groups,
  backendUrl: string
): CallToolResult => ({
  content: [textGroupOf(text, backendUrl), ...pictureGroupOf(pictures, backendUrl)]
});

const textGroupOf = (results: TextResult[], backendUrl: string): Block => ({
  type: 'text',
  text:
    results.length === 0
      ? emptyGroupTextOf('Text')
      : [
          'Results of the Text group:',
          ...results.map(result => textResultOf(result, backendUrl))
        ].join('\n\n')
});

const pictureGroupOf = (pictures: PictureResult[], backendUrl: string): Block[] =>
  pictures.length === 0
    ? [{type: 'text', text: emptyGroupTextOf('Picture')}]
    : [
        {type: 'text', text: 'Results of the Picture group:'},
        ...pictures.flatMap(picture => pictureResultOf(picture, backendUrl))
      ];

const emptyGroupTextOf = (group: 'Text' | 'Picture'): string =>
  [
    `The Search found no ${group} Result.`,
    'Try other words or another language,',
    'or call `list_resources` to see if a file is still `ingesting`.'
  ].join(' ');

const textResultOf = (result: TextResult, backendUrl: string): string =>
  [
    `- ${result.name}`,
    `  Resource id: ${result.resourceId}`,
    `  Content type: ${result.contentType}`,
    ...(result.page === undefined ? [] : [`  Page: ${result.page}`]),
    `  File: ${new URL(result.fileUrl, backendUrl)}`,
    '  Match:',
    ...result.text.split('\n').map(line => `    ${line}`)
  ].join('\n');

const pictureResultOf = (
  {result, thumbnail}: PictureResult,
  backendUrl: string
): Block[] => [
  {
    type: 'text',
    text: [`- ${result.name}`, `  File: ${new URL(result.fileUrl, backendUrl)}`].join(
      '\n'
    )
  },
  ...(thumbnail === undefined ? [] : [imageOf(thumbnail)])
];

const imageOf = ({bytes, mediaType}: Thumbnail): ImageContent => ({
  type: 'image',
  data: Buffer.from(bytes).toString('base64'),
  mimeType: mediaType
});
