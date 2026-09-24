import {randomUUID} from 'node:crypto';

export const ChunkTextMother = {
  random(): string {
    return `A paragraph that holds the words ${randomUUID()}.`;
  }
};
