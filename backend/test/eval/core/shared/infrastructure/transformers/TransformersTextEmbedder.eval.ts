import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {AutoTokenizer, type PreTrainedTokenizer} from '@huggingface/transformers';
import {TEXT_GOLDEN_SET} from '../../../../../../evals/TextGoldenSet';
import {TEXT_RESULTS_LIMIT} from '../../../../../../src/api/config/TextResultsLimit';
import {CUT} from '../../../../../../src/core/ingestion/domain/Cut';
import {CodePointCutter} from '../../../../../../src/core/ingestion/infrastructure/CodePointCutter';
import {ContentTypeTextExtractor} from '../../../../../../src/core/ingestion/infrastructure/ContentTypeTextExtractor';
import {ResourceId} from '../../../../../../src/core/resources/domain/value-objects/ResourceId';
import {ExtensionContentTypeResolver} from '../../../../../../src/core/resources/infrastructure/ExtensionContentTypeResolver';
import type {Match} from '../../../../../../src/core/search/domain/Match';
import type {Result} from '../../../../../../src/core/search/domain/Result';
import {Floor} from '../../../../../../src/core/search/domain/value-objects/Floor';
import {RERANKER_MODEL} from '../../../../../../src/core/search/infrastructure/transformers/RerankerModel';
import {TransformersReranker} from '../../../../../../src/core/search/infrastructure/transformers/TransformersReranker';
import {
  readFromTheModelStore,
  refuseAMissingModel
} from '../../../../../../src/core/shared/infrastructure/transformers/modelStore';
import {TEXT_MODEL} from '../../../../../../src/core/shared/infrastructure/transformers/TextModel';
import {TransformersTextEmbedder} from '../../../../../../src/core/shared/infrastructure/transformers/TransformersTextEmbedder';
import {runEval} from '../../../../../lib/runEval';
import {
  bestFirst,
  type Candidate,
  namesIn,
  type Ranking,
  searchEvalOf
} from '../../../../../lib/searchEvalOf';

// The adapter gives the model these tokens for a Chunk that fits in one window.
const PASSAGE_PREFIX = 'passage: ';

// The kinds of content of issue #26, each repeated to the length of the cap.
const SAMPLES = {
  'Spanish prose':
    'La biblioteca guarda cada archivo que el propietario añade, y lo lee para que más tarde pueda encontrarlo por lo que dice y no por su nombre. Un informe escaneado no tiene texto, así que la fila lo dice y no miente. ',
  'English prose':
    'The library keeps every file that the owner adds, and reads it so that later it can be found by what it says and not by its name. A scanned report has no text, so the row says so and does not lie. ',
  Markdown:
    '## Installation\n\n- Run **npm install** in the `app` folder.\n- See [the guide](https://example.com/docs/getting-started/installation.html).\n\n| Option | Default |\n|---|---|\n| `port` | 8080 |\n\n',
  'source code':
    'const totalOf = (items: readonly {price: number; quantity: number}[]): number => {\n  return items.reduce((sum, {price, quantity}) => sum + price * quantity, 0);\n};\nSELECT id, name FROM customers WHERE country = $1 ORDER BY created_at;\n',
  'a table of numbers':
    'INV-2026-0417  12/03/2026  4.312,50 EUR  21 %  905,63  5.218,13\nINV-2026-0418  13/03/2026  17,99 EUR  10 %  1,80  19,79\n',
  'PDF-extracted text':
    'El sistema lee el archivo, corta el texto en frag-\nmentos y guarda cada fragmento con su vector.\nUna página escaneada no da texto, y el docu-\nmento queda marcado como fallido.\n',
  digits: '31415926535897932384626433832795028841971693993751058209749445923078164062862',
  'a string with no spaces':
    'aHR0cHM6Ly9naXRodWIuY29tL2phdmllcnBvbmZlcnJhZGFsb3Blei9sb2NhbC1zZW1hbnRpYy1zZWFyY2g',
  'characters the vocabulary does not know': '𓀀 𓀁 𓀂 𓀃 𓀄 𓀅 𓀆 𓀇 𓀈 𓀉 𓀊 𓀋 𓀌 𓀍 𓀎 𓀏 '
};

type Kind = keyof typeof SAMPLES;

// The output is the count of tokens, and the expected value is the wall.
type Count = {output: number; expected: number};

const fitsTheWall = ({output, expected}: Count): number => (output <= expected ? 1 : 0);

const shareOfTheWall = ({output, expected}: Count): number => output / expected;

const atTheCap = (sample: string): string => {
  const codePoints = Array.from(sample);
  const repeated = Array.from(
    {length: CUT.cap},
    (_, index) => codePoints[index % codePoints.length]
  );

  return repeated.join('');
};

let tokenizer: PreTrainedTokenizer | undefined;

// The tokenizer that bootstrap fetched, and never the weights: a count of tokens needs no model.
const theTokenizer = async (): Promise<PreTrainedTokenizer> => {
  readFromTheModelStore();
  await refuseAMissingModel(TEXT_MODEL.repository);
  tokenizer ??= await AutoTokenizer.from_pretrained(TEXT_MODEL.repository);

  return tokenizer;
};

// ADR-0014: the cap in code points fits the wall of tokens, or the adapter cuts windows.
runEval<Kind, number, number>('the-cap-fits-the-wall-of-tokens', {
  data: async () => {
    const wall = (await theTokenizer()).model_max_length;

    return Object.keys(SAMPLES).map(kind => ({input: kind as Kind, expected: wall}));
  },
  task: async (kind: Kind): Promise<number> => {
    const text = `${PASSAGE_PREFIX}${atTheCap(SAMPLES[kind])}`;

    return (await theTokenizer()).encode(text).length;
  },
  scorers: [
    {name: 'fits the wall', score: fitsTheWall},
    {name: 'share of the wall', score: shareOfTheWall}
  ],
  counts: []
});

const CORPUS_FOLDER = join(import.meta.dirname, '../../../../../../evals/corpus');

const TEXT_FLOOR = Floor.of({value: RERANKER_MODEL.floor});

const RESOLVER = new ExtensionContentTypeResolver();
const EXTRACTOR = new ContentTypeTextExtractor();
const CUTTER = new CodePointCutter();

let embedder: Promise<TransformersTextEmbedder> | undefined;
let reranker: Promise<TransformersReranker> | undefined;
let corpus: Promise<Candidate<Match>[]> | undefined;

const theEmbedder = (): Promise<TransformersTextEmbedder> => {
  embedder ??= TransformersTextEmbedder.load();

  return embedder;
};

const theReranker = (): Promise<TransformersReranker> => {
  reranker ??= TransformersReranker.load();

  return reranker;
};

const chunksOf = async (name: string): Promise<Candidate<Match>[]> => {
  const textEmbedder = await theEmbedder();
  const {value: contentType} = RESOLVER.resolveText(name);
  const texts = await EXTRACTOR.extract(
    await readFile(join(CORPUS_FOLDER, name)),
    contentType
  );
  const chunks: Candidate<Match>[] = [];

  for (const chunk of CUTTER.cut({resourceId: ResourceId.random(), contentType, texts})) {
    const {text, page} = chunk.toPrimitives();

    chunks.push({name, match: {text, page}, vector: await textEmbedder.embedChunk(text)});
  }

  return chunks;
};

const embedTheCorpus = async (): Promise<Candidate<Match>[]> => {
  const chunks: Candidate<Match>[] = [];

  for (const name of await namesIn(CORPUS_FOLDER)) {
    chunks.push(...(await chunksOf(name)));
  }

  return chunks;
};

const theCorpus = (): Promise<Candidate<Match>[]> => {
  corpus ??= embedTheCorpus();

  return corpus;
};

// The Reranker reads only the best Match, so the name of the Resource stands for its keys.
const resultOf = ({name, bestMatch}: Ranking<Match>[number]): Result => ({
  resourceId: name,
  name,
  contentType: RESOLVER.resolveText(name).value,
  fileKey: name,
  bestMatch
});

// The two stages of Search (ADR-0040), in memory.
const twoStageRankingOf = async (query: string): Promise<Ranking<Match>> => {
  const firstStage = bestFirst(
    await (await theEmbedder()).embedQuery(query),
    await theCorpus()
  )
    .slice(0, TEXT_RESULTS_LIMIT)
    .map(resultOf);

  return (await theReranker()).rerank(query, firstStage);
};

runEval(
  'the-text-search-of-the-golden-set',
  searchEvalOf({
    corpusFolder: CORPUS_FOLDER,
    goldenSet: TEXT_GOLDEN_SET,
    rankingOf: twoStageRankingOf,
    passesTheFloor: (ranking: Ranking<Match>): boolean => TEXT_FLOOR.isReachedBy(ranking)
  })
);
