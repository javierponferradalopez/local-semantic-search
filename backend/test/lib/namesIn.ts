import {readdir} from 'node:fs/promises';

// A dotfile, such as .gitkeep, is not a Resource.
export const namesIn = async (corpusFolder: string): Promise<string[]> =>
  (await readdir(corpusFolder)).filter(name => !name.startsWith('.'));
