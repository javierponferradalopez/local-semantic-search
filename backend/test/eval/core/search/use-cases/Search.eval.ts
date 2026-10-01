import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {MANIFEST} from '../../../../../evals/Manifest';
import {TEXT_GOLDEN_SET} from '../../../../../evals/TextGoldenSet';
import {container} from '../../../../../src/api/config/di/Container';
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
  type TextGroup
} from '../../../../lib/groupScorers';
import {RecordingReranker} from '../../../../lib/RecordingReranker';
import {runEval} from '../../../../lib/runEval';
import {namesIn} from '../../../../lib/searchEvalOf';
import {useTheTestApi} from '../../../../lib/testApi';

const CORPUS_FOLDER = join(import.meta.dirname, '../../../../../evals/corpus');

const TEXT_FLOOR = Floor.of({value: RERANKER_MODEL.floor});

const api = useTheTestApi({wipeTheStore: 'once'});

let reranker: RecordingReranker;
let search: Search;

// As the owner creates a Resource, so the eval measures the Ingest that ships.
const ingestTheCorpus = async (): Promise<void> => {
  for (const name of Object.keys(MANIFEST.resources)) {
    const response = await api.createTextResource(
      name,
      await readFile(join(CORPUS_FOLDER, name))
    );

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

// The same Search and Floors as the wiring, so a new parameter of Search breaks this compile.
const theSearch = (): Search =>
  new Search({
    textEmbedder: container.getDependency(TransformersTextEmbedder),
    imageEmbedder: container.getDependency(TransformersImageEmbedder),
    resultReader: container.getDependency(DrizzleResultReader),
    reranker,
    pictureResultReader: container.getDependency(DrizzlePictureResultReader),
    fileStore: container.getDependency(FilesystemFileStore),
    textFloor: RERANKER_MODEL.floor,
    imageFloor: VISION_MODEL.floor
  });

beforeAll(async () => {
  reranker = new RecordingReranker({
    reranker: container.getDependency(TransformersReranker)
  });
  search = theSearch();
  await ingestTheCorpus();
});

// Search gives an empty group when the group fails, so the eval finds the failure itself.
const textGroupOf = async (query: string): Promise<TextGroup> => {
  const {text} = await search.run({query});
  const reranking = reranker.takeTheLastReranking();

  // The store holds the corpus, so a group that did not fail always reaches the Reranker.
  const failed =
    reranking === undefined ||
    (text.length === 0 && TEXT_FLOOR.isReachedBy(reranking.reranked));

  if (failed) {
    throw new Error(`The text group of a Search failed for the Query "${query}".`);
  }

  return {
    shown: text.map(({name}) => name),
    firstStage: reranking.firstStage.map(({name}) => name)
  };
};

runEval('the-text-group-of-a-search', {
  data: async () =>
    goldenCasesOf({
      manifest: MANIFEST,
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
  counts: []
});
