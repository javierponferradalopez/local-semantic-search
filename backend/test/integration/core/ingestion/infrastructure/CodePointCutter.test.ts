import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {CUT} from '../../../../../src/core/ingestion/domain/Cut';
import {CodePointCutter} from '../../../../../src/core/ingestion/infrastructure/CodePointCutter';
import {ResourceId} from '../../../../../src/core/resources/domain/value-objects/ResourceId';

const FIXTURES = join(import.meta.dirname, '../../../../fixtures');

const codePointsOf = (text: string): number => Array.from(text).length;

const withoutWhitespace = (text: string): string => text.replace(/\s/gu, '');

// A paragraph of exactly `size` code points, with no sentence break inside it.
const aParagraphOf = (size: number): string => {
  const words = 'aaaaaaaaa '.repeat(Math.ceil(size / 10));

  return `${words.slice(0, size - 1).trim()}.`;
};

describe('CodePointCutter', () => {
  const cutter = new CodePointCutter();
  const resourceId = ResourceId.random();

  const textsOf = (text: string): string[] =>
    cutter
      .cut({resourceId, contentType: 'plain_text', texts: [text]})
      .map(chunk => chunk.text.value);

  describe('#cut', () => {
    describe('a text file', () => {
      let longText: string;
      let chunks: string[];

      beforeAll(async () => {
        longText = await readFile(join(FIXTURES, 'long-text.txt'), 'utf8');
        chunks = textsOf(longText);
      });

      it('should give no Chunk over the cap', () => {
        for (const chunk of chunks) {
          expect(codePointsOf(chunk)).toBeLessThanOrEqual(CUT.cap);
        }
      });

      it('should give no Chunk under the minimum when it can join', () => {
        for (const chunk of chunks) {
          expect(codePointsOf(chunk)).toBeGreaterThanOrEqual(CUT.minimum);
        }
      });

      it('should keep every character, in order, with no overlap', () => {
        expect(withoutWhitespace(chunks.join(''))).toBe(withoutWhitespace(longText));
      });

      it('should keep each paragraph under the cap whole inside one Chunk', () => {
        const paragraphs = longText
          .split(/\n\s*\n/)
          .map(paragraph => paragraph.trim())
          .filter(paragraph => codePointsOf(paragraph) <= CUT.cap);

        for (const paragraph of paragraphs) {
          expect(chunks.some(chunk => chunk.includes(paragraph))).toBe(true);
        }
      });

      it('should give the positions in order, the cut version in force, and no page', () => {
        const cut = cutter.cut({
          resourceId,
          contentType: 'plain_text',
          texts: [longText]
        });

        expect(cut.map(chunk => chunk.toPrimitives().position)).toStrictEqual(
          cut.map((_, index) => index)
        );

        for (const chunk of cut) {
          expect(chunk.toPrimitives()).toMatchObject({
            resourceId: resourceId.value,
            cutVersion: CUT.version
          });
          expect(chunk.toPrimitives()).not.toHaveProperty('page');
        }
      });
    });

    describe('the target', () => {
      it('should join paragraphs until the next one would pass the target', () => {
        const [first, second, third] = [500, 500, 500].map(aParagraphOf);

        expect(textsOf(`${first}\n\n${second}\n\n${third}`)).toStrictEqual([
          `${first}\n\n${second}`,
          third
        ]);
      });

      it('should cut at a blank line that holds spaces', () => {
        const [first, second] = [800, 800].map(aParagraphOf);

        expect(textsOf(`${first}\n   \n${second}`)).toStrictEqual([first, second]);
      });

      it('should give a short text alone as one Chunk', () => {
        expect(textsOf('A short note.')).toStrictEqual(['A short note.']);
      });
    });

    describe('the minimum', () => {
      it('should join a paragraph under the minimum to the next one, past the target', () => {
        const short = aParagraphOf(100);
        const long = aParagraphOf(1150);

        expect(textsOf(`${short}\n\n${long}`)).toStrictEqual([`${short}\n\n${long}`]);
      });

      it('should join a last paragraph under the minimum to the one before it', () => {
        const long = aParagraphOf(1150);
        const short = aParagraphOf(100);

        expect(textsOf(`${long}\n\n${short}`)).toStrictEqual([`${long}\n\n${short}`]);
      });

      it('should give a paragraph under the minimum alone when no join fits the cap', () => {
        const [first, short, last] = [1450, 100, 1450].map(aParagraphOf);

        expect(textsOf(`${first}\n\n${short}\n\n${last}`)).toStrictEqual([
          first,
          short,
          last
        ]);
      });
    });

    describe('the cap', () => {
      it('should cut a paragraph over the cap by sentence, and split no sentence', () => {
        const sentences = Array.from(
          {length: 40},
          (_, index) => `The sentence number ${index} holds a few more words.`
        );
        const paragraph = sentences.join(' ');

        const chunks = textsOf(paragraph);

        expect(codePointsOf(paragraph)).toBeGreaterThan(CUT.cap);
        expect(chunks.length).toBeGreaterThan(1);

        for (const chunk of chunks) {
          expect(codePointsOf(chunk)).toBeLessThanOrEqual(CUT.cap);
          expect(chunk.endsWith('words.')).toBe(true);
        }
      });

      it('should cut a sentence over the cap at the last whitespace before the cap', () => {
        const words = Array.from({length: 400}, (_, index) => `word${index}`);
        const sentence = words.join(' ');

        const chunks = textsOf(sentence);

        expect(chunks.length).toBeGreaterThan(1);

        for (const chunk of chunks) {
          expect(codePointsOf(chunk)).toBeLessThanOrEqual(CUT.cap);
        }

        expect(chunks.flatMap(chunk => chunk.split(' '))).toStrictEqual(words);
      });

      it('should cut a text with no whitespace at the cap exactly', () => {
        const digits = '7'.repeat(CUT.cap * 2 + 300);

        expect(textsOf(digits).map(codePointsOf)).toStrictEqual([CUT.cap, CUT.cap, 300]);
      });

      it('should measure in code points, and not in UTF-16 units', () => {
        const emoji = `🙂${'🙂a'.repeat(CUT.cap / 2 - 1)}`;

        expect(emoji.length).toBeGreaterThan(CUT.cap);
        expect(textsOf(emoji)).toStrictEqual([emoji]);
      });
    });

    describe('a passage with no letter and no digit', () => {
      it('should skip it', async () => {
        const text = await readFile(join(FIXTURES, 'no-letter-and-no-digit.txt'), 'utf8');

        expect(textsOf(text)).toStrictEqual([]);
      });

      it('should skip it between two paragraphs', () => {
        expect(textsOf('The first.\n\n---\n\nThe second.')).toStrictEqual([
          'The first.\n\nThe second.'
        ]);
      });

      it('should give no Chunk for an empty text', () => {
        expect(textsOf('')).toStrictEqual([]);
      });
    });
  });
});
