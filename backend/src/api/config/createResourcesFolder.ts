import {mkdir} from 'node:fs/promises';
import {join} from 'node:path';
import {env} from '../env/env';

const RESOURCES_FOLDER = 'resources';

export const createResourcesFolder = async (): Promise<void> => {
  await mkdir(join(env.files.directory, RESOURCES_FOLDER), {recursive: true});
};
