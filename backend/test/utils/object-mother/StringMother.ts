import {randomBytes, randomInt, randomUUID} from 'node:crypto';

const HEXADECIMAL_CHARACTERS_PER_BYTE = 2;
const NAME_LENGTH = 10;
const CHECKSUM_LENGTH = 64;

const EGYPTIAN_HIEROGLYPHS = {first: 0x13000, last: 0x1342e};
const NO_SPACE_ALPHABET =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

const randomOf = (length: number, codePointAt: (index: number) => string): string =>
  Array.from({length}, (_, index) => codePointAt(index)).join('');

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
  },

  randomDigits(length: number): string {
    return randomOf(length, () => String(randomInt(10)));
  },

  randomWithNoSpaces(length: number): string {
    return randomOf(length, () => NO_SPACE_ALPHABET[randomInt(NO_SPACE_ALPHABET.length)]);
  },

  // A space between two of them, so that each one is an unknown token, and not each run.
  randomUnknownToTheVocabulary(length: number): string {
    return randomOf(length, index =>
      index % 2 === 1
        ? ' '
        : String.fromCodePoint(
            randomInt(EGYPTIAN_HIEROGLYPHS.first, EGYPTIAN_HIEROGLYPHS.last + 1)
          )
    );
  }
};
