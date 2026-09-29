import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {IMAGE_GOLDEN_SET} from '../../../../../../evals/ImageGoldenSet';
import {SharpImageDecoder} from '../../../../../../src/core/ingestion/infrastructure/sharp/SharpImageDecoder';
import {ExtensionContentTypeResolver} from '../../../../../../src/core/resources/infrastructure/ExtensionContentTypeResolver';
import type {PictureMatch} from '../../../../../../src/core/search/domain/PictureMatch';
import {Floor} from '../../../../../../src/core/search/domain/value-objects/Floor';
import {TransformersImageEmbedder} from '../../../../../../src/core/shared/infrastructure/transformers/TransformersImageEmbedder';
import {VISION_MODEL} from '../../../../../../src/core/shared/infrastructure/transformers/VisionModel';
import {runEval} from '../../../../../lib/runEval';
import {
  bestFirst,
  type Candidate,
  namesIn,
  type Ranking,
  searchEvalOf
} from '../../../../../lib/searchEvalOf';

const CORPUS_FOLDER = join(import.meta.dirname, '../../../../../../evals/image-corpus');

const IMAGE_FLOOR = Floor.of({value: VISION_MODEL.floor});

const RESOLVER = new ExtensionContentTypeResolver();
const DECODER = new SharpImageDecoder();

let embedder: Promise<TransformersImageEmbedder> | undefined;
let corpus: Promise<Candidate<PictureMatch>[]> | undefined;

const theEmbedder = (): Promise<TransformersImageEmbedder> => {
  embedder ??= TransformersImageEmbedder.load();

  return embedder;
};

const pictureOf = async (name: string): Promise<Candidate<PictureMatch>> => {
  const {value: contentType} = RESOLVER.resolveImage(name);
  const {pixels} = await DECODER.decode(
    await readFile(join(CORPUS_FOLDER, name)),
    contentType
  );

  return {name, match: {}, vector: await (await theEmbedder()).embedPicture(pixels)};
};

const embedTheCorpus = async (): Promise<Candidate<PictureMatch>[]> => {
  const pictures: Candidate<PictureMatch>[] = [];

  for (const name of await namesIn(CORPUS_FOLDER)) {
    pictures.push(await pictureOf(name));
  }

  return pictures;
};

const theCorpus = (): Promise<Candidate<PictureMatch>[]> => {
  corpus ??= embedTheCorpus();

  return corpus;
};

runEval(
  'the-image-search-of-the-golden-set',
  searchEvalOf({
    corpusFolder: CORPUS_FOLDER,
    goldenSet: IMAGE_GOLDEN_SET,
    rankingOf: async (query: string): Promise<Ranking<PictureMatch>> =>
      bestFirst(await (await theEmbedder()).embedQuery(query), await theCorpus()),
    passesTheFloor: (ranking: Ranking<PictureMatch>): boolean =>
      IMAGE_FLOOR.isReachedBy(ranking)
  })
);
