import {AutoModel, AutoTokenizer, type DataType, env} from '@huggingface/transformers';
import {readFromTheModelStore} from '../src/core/shared/infrastructure/transformers/modelStore';
import {TEXT_MODEL} from '../src/core/shared/infrastructure/transformers/TextModel';

type Model = {repository: string; dtype: DataType};

const MODELS: Model[] = [TEXT_MODEL];

const fetchTheModels = async (): Promise<void> => {
  readFromTheModelStore();
  env.allowRemoteModels = true;

  for (const {repository, dtype} of MODELS) {
    console.log(`Fetching ${repository} (${dtype}) into the model store`);

    await AutoTokenizer.from_pretrained(repository);
    await AutoModel.from_pretrained(repository, {dtype});
  }
};

fetchTheModels().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
