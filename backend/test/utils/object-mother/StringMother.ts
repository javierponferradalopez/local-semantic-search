import {randomBytes, randomUUID} from 'node:crypto';

const HEXADECIMAL_CHARACTERS_PER_BYTE = 2;
const NAME_LENGTH = 10;
const CHECKSUM_LENGTH = 64;

const randomHexadecimal = (length: number): string => {
  const bytes = Math.ceil(length / HEXADECIMAL_CHARACTERS_PER_BYTE);

  return randomBytes(bytes).toString('hex').slice(0, length);
};

export const StringMother = {
  randomUuid(): string {
    return randomUUID();
  },

  randomChecksum(): string {
    return randomHexadecimal(CHECKSUM_LENGTH);
  },

  randomFileName(extension: string): string {
    return `${randomHexadecimal(NAME_LENGTH)}${extension}`;
  }
};
