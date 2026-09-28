import {readdir, readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {AutoTokenizer, type PreTrainedTokenizer} from '@huggingface/transformers';
import {type GoldenCase, TEXT_GOLDEN_SET} from '../../../../../../evals/TextGoldenSet';
import {CUT} from '../../../../../../src/core/ingestion/domain/Cut';
import {CodePointCutter} from '../../../../../../src/core/ingestion/infrastructure/CodePointCutter';
import {ContentTypeTextExtractor} from '../../../../../../src/core/ingestion/infrastructure/ContentTypeTextExtractor';
import {ResourceId} from '../../../../../../src/core/resources/domain/value-objects/ResourceId';
import {ExtensionContentTypeResolver} from '../../../../../../src/core/resources/infrastructure/ExtensionContentTypeResolver';
import type {Match} from '../../../../../../src/core/search/domain/Match';
import {Floor} from '../../../../../../src/core/search/domain/value-objects/Floor';
import type {Vector} from '../../../../../../src/core/shared/domain/value-objects/Vector';
import {
  readFromTheModelStore,
  refuseAMissingModel
} from '../../../../../../src/core/shared/infrastructure/transformers/modelStore';
import {TEXT_MODEL} from '../../../../../../src/core/shared/infrastructure/transformers/TextModel';
import {TransformersTextEmbedder} from '../../../../../../src/core/shared/infrastructure/transformers/TransformersTextEmbedder';
import {runEval} from '../../../../../lib/runEval';

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

const TEXT_FLOOR = Floor.of({value: TEXT_MODEL.floor});

type Expected = GoldenCase['expected'];

type Ranking = {name: string; bestMatch: Match}[];

type EmbeddedChunk = {name: string; match: Omit<Match, 'score'>; vector: Vector};

type Judged = {output: Ranking; expected: Expected};

const RESOLVER = new ExtensionContentTypeResolver();
const EXTRACTOR = new ContentTypeTextExtractor();
const CUTTER = new CodePointCutter();

let embedder: Promise<TransformersTextEmbedder> | undefined;
let corpus: Promise<EmbeddedChunk[]> | undefined;

const theEmbedder = (): Promise<TransformersTextEmbedder> => {
  embedder ??= TransformersTextEmbedder.load();

  return embedder;
};

// A dotfile, such as .gitkeep, is not a Resource.
const namesInTheCorpus = async (): Promise<string[]> =>
  (await readdir(CORPUS_FOLDER)).filter(name => !name.startsWith('.'));

const chunksOf = async (name: string): Promise<EmbeddedChunk[]> => {
  const textEmbedder = await theEmbedder();
  const {value: contentType} = RESOLVER.resolve(name);
  const texts = await EXTRACTOR.extract(
    await readFile(join(CORPUS_FOLDER, name)),
    contentType
  );
  const chunks: EmbeddedChunk[] = [];

  for (const chunk of CUTTER.cut({resourceId: ResourceId.random(), contentType, texts})) {
    const {text, page} = chunk.toPrimitives();

    chunks.push({name, match: {text, page}, vector: await textEmbedder.embedChunk(text)});
  }

  return chunks;
};

const embedTheCorpus = async (): Promise<EmbeddedChunk[]> => {
  const chunks: EmbeddedChunk[] = [];

  for (const name of await namesInTheCorpus()) {
    chunks.push(...(await chunksOf(name)));
  }

  return chunks;
};

const theCorpus = (): Promise<EmbeddedChunk[]> => {
  corpus ??= embedTheCorpus();

  return corpus;
};

const cosineOf = ({value: a}: Vector, {value: b}: Vector): number => {
  const dot = a.reduce((sum, value, index) => sum + value * b[index], 0);
  const norm = (values: readonly number[]): number => Math.hypot(...values);

  return dot / (norm(a) * norm(b));
};

// In memory, as ADR-0016 rules: the SQL of the grouping is proved by integration.
const rankingOf = async (query: string): Promise<Ranking> => {
  const vector = await (await theEmbedder()).embedQuery(query);
  const bestMatches = new Map<string, Match>();

  for (const chunk of await theCorpus()) {
    const score = cosineOf(vector, chunk.vector);
    const best = bestMatches.get(chunk.name);

    if (best === undefined || score > best.score) {
      bestMatches.set(chunk.name, {...chunk.match, score});
    }
  }

  return Array.from(bestMatches, ([name, bestMatch]) => ({name, bestMatch})).sort(
    (first, second) => second.bestMatch.score - first.bestMatch.score
  );
};

const passesTheFloor = (output: Ranking): boolean => TEXT_FLOOR.isReachedBy(output);

// A Query with no answer in the corpus has no rank.
const reciprocalRank = ({output, expected}: Judged): number | undefined => {
  if (expected === null) {
    return undefined;
  }

  const index = output.findIndex(({name}) => name === expected);

  return index === -1 ? 0 : 1 / (index + 1);
};

const verdictOfTheFloor = ({output, expected}: Judged): number =>
  passesTheFloor(output) === (expected !== null) ? 1 : 0;

const isARealQueryTheFloorRejects = ({output, expected}: Judged): boolean =>
  expected !== null && !passesTheFloor(output);

// ADR-0016 and ADR-0021: the ranking and the gate, on the owner's corpus and in the owner's words.
runEval<string, Ranking, Expected>('the-text-search-of-the-golden-set', {
  data: async () => {
    const names = new Set(await namesInTheCorpus());

    return TEXT_GOLDEN_SET.map(({query, expected}) => {
      if (expected !== null && !names.has(expected)) {
        throw new Error(
          `The golden set expects ${expected}, which is not in the corpus.`
        );
      }

      return {input: query, expected};
    });
  },
  task: rankingOf,
  scorers: [
    {name: 'reciprocal rank', score: reciprocalRank},
    {name: 'verdict of the Floor', score: verdictOfTheFloor}
  ],
  counts: [{name: 'real Query the Floor rejects', holds: isARealQueryTheFloorRejects}]
});
