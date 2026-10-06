import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {IMAGE_GOLDEN_SET} from '../../../../../evals/ImageGoldenSet';
import {MANIFEST} from '../../../../../evals/Manifest';
import {TEXT_GOLDEN_SET} from '../../../../../evals/TextGoldenSet';
import {container} from '../../../../../src/api/config/di/Container';
import type {PictureResult} from '../../../../../src/core/search/domain/PictureResult';
import type {Result} from '../../../../../src/core/search/domain/Result';
import {Floor} from '../../../../../src/core/search/domain/value-objects/Floor';
import {DrizzlePictureResultReader} from '../../../../../src/core/search/infrastructure/drizzle/DrizzlePictureResultReader';
import {DrizzleResultReader} from '../../../../../src/core/search/infrastructure/drizzle/DrizzleResultReader';
import {RERANKER_MODEL} from '../../../../../src/core/search/infrastructure/transformers/RerankerModel';
import {TransformersReranker} from '../../../../../src/core/search/infrastructure/transformers/TransformersReranker';
import {Search} from '../../../../../src/core/search/use-cases/Search';
import {FilesystemFileStore} from '../../../../../src/core/shared/infrastructure/FilesystemFileStore';
import {TransformersImageEmbedder} from '../../../../../src/core/shared/infrastructure/transformers/TransformersImageEmbedder';
import {TransformersTextEmbedder} from '../../../../../src/core/shared/infrastructure/transformers/TransformersTextEmbedder';
import {VISION_MODEL} from '../../../../../src/core/shared/infrastructure/transformers/VisionModel';
import {goldenCasesOf} from '../../../../lib/goldenCasesOf';
import {
  f05,
  firstStageRecall,
  nearLeak,
  precision,
  recall,
  reciprocalRank,
  rightEmpty,
  type Shown,
  type TextGroup
} from '../../../../lib/groupScorers';
import {namesIn} from '../../../../lib/namesIn';
import {RecordingPictureResultReader} from '../../../../lib/RecordingPictureResultReader';
import type {Reranking} from '../../../../lib/RecordingReranker';
import {RecordingReranker} from '../../../../lib/RecordingReranker';
import {runEval} from '../../../../lib/runEval';
import {useTheTestApi} from '../../../../lib/testApi';

const CORPUS_FOLDER = join(import.meta.dirname, '../../../../../evals/corpus');
const IMAGE_CORPUS_FOLDER = join(
  import.meta.dirname,
  '../../../../../evals/image-corpus'
);

const TEXT_FLOOR = Floor.of({value: RERANKER_MODEL.floor});
const IMAGE_FLOOR = Floor.of({value: VISION_MODEL.floor});

const api = useTheTestApi({wipeTheStore: 'once'});

let reranker: RecordingReranker;
let pictureResultReader: RecordingPictureResultReader;
let search: Search;

type Create = (name: string, content: Buffer) => Promise<Response>;

// As the owner creates a Resource, so the eval measures the Ingest that ships.
const ingest = async (
  names: readonly string[],
  folder: string,
  create: Create
): Promise<void> => {
  for (const name of names) {
    const response = await create(name, await readFile(join(folder, name)));

    if (!response.ok) {
      throw new Error(`The API refused ${name}: ${await response.text()}`);
    }

    const {id} = (await response.json()) as {id: string};
    const {ingestState, reason} = await api.rowOnceIngested(id);

    if (ingestState === 'failed') {
      throw new Error(`The Resource ${name} became Failed, with the Reason ${reason}.`);
    }
  }
};

// The same Search, Floors and Margins as the wiring, so a new parameter of Search breaks this compile.
const theSearch = (): Search =>
  new Search({
    textEmbedder: container.getDependency(TransformersTextEmbedder),
    imageEmbedder: container.getDependency(TransformersImageEmbedder),
    resultReader: container.getDependency(DrizzleResultReader),
    reranker,
    pictureResultReader,
    fileStore: container.getDependency(FilesystemFileStore),
    textFloor: RERANKER_MODEL.floor,
    textMargin: RERANKER_MODEL.margin,
    imageFloor: VISION_MODEL.floor,
    imageMargin: VISION_MODEL.margin
  });

beforeAll(async () => {
  reranker = new RecordingReranker({
    reranker: container.getDependency(TransformersReranker)
  });
  pictureResultReader = new RecordingPictureResultReader({
    pictureResultReader: container.getDependency(DrizzlePictureResultReader)
  });
  search = theSearch();
  await ingest(Object.keys(MANIFEST.texts), CORPUS_FOLDER, api.createTextResource);
  await ingest(
    Object.keys(MANIFEST.images),
    IMAGE_CORPUS_FOLDER,
    api.createImageResource
  );
});

type Scored = {name: string; score: number};

const scoredOf = (results: readonly (Result | PictureResult)[]): Scored[] =>
  results.map(({name, bestMatch}) => ({name, score: bestMatch.score}));

// The Results keep their scores when the Floor hides the list, so that you can tune a cut on them.
type Traced<Group, Trace> = Group & {trace: Trace};

const traceOf = <Trace>({trace}: {trace: Trace}): Trace => trace;

// shown is the number of Results that the group shows, as it shows the first of them.
type TextTrace = {shown: number; results: Scored[]; firstStage: Scored[]};

type ImageTrace = {shown: number; results: Scored[]};

const shownCountOf = (
  query: string,
  shown: readonly string[],
  results: readonly Scored[]
): number => {
  if (shown.some((name, index) => results[index]?.name !== name)) {
    throw new Error(
      `The list that a group shows for the Query "${query}" is not the first of its Results.`
    );
  }

  return shown.length;
};

type Recorded = {
  text: string[];
  images: string[];
  reranking: Reranking | undefined;
  pictureResults: readonly PictureResult[] | undefined;
};

// Each Search runs the two groups, so each takes the two recordings: none is stale.
const recordedSearchOf = async (query: string): Promise<Recorded> => {
  const {text, images} = await search.run({query});

  return {
    text: text.map(({name}) => name),
    images: images.map(({name}) => name),
    reranking: reranker.takeTheLastReranking(),
    pictureResults: pictureResultReader.takeTheLastResults()
  };
};

// Search gives an empty group when the group fails, so the eval finds the failure itself.
// The store holds the corpus, so a group that did not fail always reads its Results.
const textGroupOf = async (query: string): Promise<Traced<TextGroup, TextTrace>> => {
  const {text, reranking} = await recordedSearchOf(query);
  const failed =
    reranking === undefined ||
    (text.length === 0 && TEXT_FLOOR.isReachedBy(reranking.reranked));

  if (failed) {
    throw new Error(`The text group of a Search failed for the Query "${query}".`);
  }

  const results = scoredOf(reranking.reranked);

  return {
    shown: text,
    firstStage: reranking.firstStage.map(({name}) => name),
    trace: {
      shown: shownCountOf(query, text, results),
      results,
      firstStage: scoredOf(reranking.firstStage)
    }
  };
};

const imageGroupOf = async (query: string): Promise<Traced<Shown, ImageTrace>> => {
  const {images, pictureResults} = await recordedSearchOf(query);
  const failed =
    pictureResults === undefined ||
    (images.length === 0 && IMAGE_FLOOR.isReachedBy(pictureResults));

  if (failed) {
    throw new Error(`The image group of a Search failed for the Query "${query}".`);
  }

  const results = scoredOf(pictureResults);

  return {shown: images, trace: {shown: shownCountOf(query, images, results), results}};
};

runEval('the-text-group-of-a-search', {
  data: async () =>
    goldenCasesOf({
      subjects: MANIFEST.subjects,
      resources: MANIFEST.texts,
      corpus: await namesIn(CORPUS_FOLDER),
      goldenSet: TEXT_GOLDEN_SET
    }),
  task: textGroupOf,
  scorers: [
    {name: 'F0.5', score: f05},
    {name: 'precision', score: precision},
    {name: 'recall', score: recall},
    {name: 'right empty', score: rightEmpty},
    {name: 'Near leak', score: nearLeak},
    {name: 'reciprocal rank', score: reciprocalRank},
    {name: 'recall@20 of the first stage', score: firstStageRecall}
  ],
  counts: [],
  trace: traceOf,
  mainScorer: 'F0.5'
});

// The image group has one stage, so it has no score of a first stage.
runEval('the-image-group-of-a-search', {
  data: async () =>
    goldenCasesOf({
      subjects: MANIFEST.subjects,
      resources: MANIFEST.images,
      corpus: await namesIn(IMAGE_CORPUS_FOLDER),
      goldenSet: IMAGE_GOLDEN_SET
    }),
  task: imageGroupOf,
  scorers: [
    {name: 'F0.5', score: f05},
    {name: 'precision', score: precision},
    {name: 'recall', score: recall},
    {name: 'right empty', score: rightEmpty},
    {name: 'Near leak', score: nearLeak},
    {name: 'reciprocal rank', score: reciprocalRank}
  ],
  counts: [],
  trace: traceOf,
  mainScorer: 'F0.5'
});
