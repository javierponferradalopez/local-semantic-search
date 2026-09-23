import {access} from 'node:fs/promises';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {env} from '@huggingface/transformers';

const MODEL_STORE_FOLDER = fileURLToPath(
  new URL('../../../../../data/models/', import.meta.url)
);

export const readFromTheModelStore = (): void => {
  env.cacheDir = MODEL_STORE_FOLDER;
  env.allowRemoteModels = false;
};

export const refuseAMissingModel = async (repository: string): Promise<void> => {
  try {
    await access(join(MODEL_STORE_FOLDER, repository));
  } catch {
    throw new Error(
      `The model store holds no ${repository}. Run pnpm run bootstrap to get its weights.`
    );
  }
};
