import {
  AutoImageProcessor,
  AutoModel,
  AutoTokenizer,
  type DataType,
  env,
  SiglipTextModel,
  SiglipVisionModel
} from '@huggingface/transformers';
import {readFromTheModelStore} from '../src/core/shared/infrastructure/transformers/modelStore';
import {TEXT_MODEL} from '../src/core/shared/infrastructure/transformers/TextModel';
import {VISION_MODEL} from '../src/core/shared/infrastructure/transformers/VisionModel';

type Preprocessor = {from_pretrained: (repository: string) => Promise<unknown>};

type Tower = {
  from_pretrained: (repository: string, options: {dtype: DataType}) => Promise<unknown>;
};

type Model = {
  repository: string;
  dtype: DataType;
  preprocessors: Preprocessor[];
  towers: Tower[];
};

const MODELS: Model[] = [
  {...TEXT_MODEL, preprocessors: [AutoTokenizer], towers: [AutoModel]},
  {
    ...VISION_MODEL,
    preprocessors: [AutoTokenizer, AutoImageProcessor],
    towers: [SiglipTextModel, SiglipVisionModel]
  }
];

const fetchTheModels = async (): Promise<void> => {
  readFromTheModelStore();
  env.allowRemoteModels = true;

  for (const {repository, dtype, preprocessors, towers} of MODELS) {
    console.log(`Fetching ${repository} (${dtype}) into the model store`);

    for (const preprocessor of preprocessors) {
      await preprocessor.from_pretrained(repository);
    }

    for (const tower of towers) {
      await tower.from_pretrained(repository, {dtype});
    }
  }
};

fetchTheModels().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
