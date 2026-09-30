import {
  AutoImageProcessor,
  AutoModel,
  AutoModelForSequenceClassification,
  AutoTokenizer,
  type DataType,
  env,
  type PretrainedConfig,
  SiglipTextModel,
  SiglipVisionModel
} from '@huggingface/transformers';
import {RerankerConfig} from '../src/core/search/infrastructure/transformers/RerankerConfig';
import {RERANKER_MODEL} from '../src/core/search/infrastructure/transformers/RerankerModel';
import {readFromTheModelStore} from '../src/core/shared/infrastructure/transformers/modelStore';
import {TEXT_MODEL} from '../src/core/shared/infrastructure/transformers/TextModel';
import {VISION_MODEL} from '../src/core/shared/infrastructure/transformers/VisionModel';

type Preprocessor = {from_pretrained: (repository: string) => Promise<unknown>};

type Tower = {
  from_pretrained: (
    repository: string,
    options: {dtype: DataType; config?: PretrainedConfig}
  ) => Promise<unknown>;
};

type Model = {
  repository: string;
  dtype: DataType;
  preprocessors: Preprocessor[];
  towers: Tower[];
  // For a model that does not load with its own config.json.
  configOf?: () => Promise<PretrainedConfig>;
};

const MODELS: Model[] = [
  {...TEXT_MODEL, preprocessors: [AutoTokenizer], towers: [AutoModel]},
  {
    ...VISION_MODEL,
    preprocessors: [AutoTokenizer, AutoImageProcessor],
    towers: [SiglipTextModel, SiglipVisionModel]
  },
  {
    ...RERANKER_MODEL,
    preprocessors: [AutoTokenizer],
    towers: [AutoModelForSequenceClassification],
    configOf: RerankerConfig.load
  }
];

const fetchTheModels = async (): Promise<void> => {
  readFromTheModelStore();
  env.allowRemoteModels = true;

  for (const {repository, dtype, preprocessors, towers, configOf} of MODELS) {
    console.log(`Fetching ${repository} (${dtype}) into the model store`);

    for (const preprocessor of preprocessors) {
      await preprocessor.from_pretrained(repository);
    }

    const config = await configOf?.();

    for (const tower of towers) {
      await tower.from_pretrained(repository, {dtype, config});
    }
  }
};

fetchTheModels().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
