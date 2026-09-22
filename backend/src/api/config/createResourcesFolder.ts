import {mkdir} from 'node:fs/promises';

const RESOURCES_FOLDER = 'data/resources';

export const createResourcesFolder = async (): Promise<void> => {
  await mkdir(RESOURCES_FOLDER, {recursive: true});
};
