import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
import type {ChunkPrimitives} from '../../../../../src/core/ingestion/domain/Chunk';
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

  const markdownTextsOf = (text: string): string[] =>
    cutter
      .cut({resourceId, contentType: 'markdown', texts: [text]})
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

    describe('a Markdown file', () => {
      const HEADINGS_OF_THE_FIXTURE = [
        '# The lighthouse at Cabo Vilán',
        '## The tower',
        '### The lamp',
        '### The engine room',
        '## The keepers',
        '## The rule that the light kept'
      ];

      let markdown: string;
      let chunks: string[];

      beforeAll(async () => {
        markdown = await readFile(join(FIXTURES, 'markdown-with-headings.md'), 'utf8');
        chunks = markdownTextsOf(markdown);
      });

      it('should give one Chunk for each section, which opens with its heading', () => {
        expect(chunks.map(chunk => chunk.split('\n')[0])).toStrictEqual(
          HEADINGS_OF_THE_FIXTURE
        );
      });

      it('should keep the markup: each Chunk is a passage of the file as it is written', () => {
        for (const chunk of chunks) {
          expect(markdown).toContain(chunk);
        }
      });

      it('should keep the fenced code block whole, and see no heading inside it', () => {
        const fence = markdown.slice(
          markdown.indexOf('```sh'),
          markdown.lastIndexOf('```') + 3
        );

        expect(chunks.filter(chunk => chunk.includes(fence))).toHaveLength(1);
      });

      it('should keep every character, in order, with no overlap', () => {
        expect(withoutWhitespace(chunks.join(''))).toBe(withoutWhitespace(markdown));
      });

      it('should give no page', () => {
        const cut = cutter.cut({resourceId, contentType: 'markdown', texts: [markdown]});

        for (const chunk of cut) {
          expect(chunk.toPrimitives()).not.toHaveProperty('page');
        }
      });
    });

    describe('a heading', () => {
      it('should close the Chunk in progress and open the next one', () => {
        expect(markdownTextsOf('The first.\n\n# A heading\n\nThe second.')).toStrictEqual(
          ['The first.', '# A heading\n\nThe second.']
        );
      });

      it('should travel with the paragraph after it, when the two pass the cap', () => {
        const opening = 'The first sentence holds some words. ';
        // A capital letter, or the segmenter sees no sentence break.
        const rest = aParagraphOf(CUT.cap - codePointsOf(opening));
        const paragraph = `${opening}A${rest.slice(1)}`;

        const [first] = markdownTextsOf(`## A heading\n\n${paragraph}`);

        expect(codePointsOf(paragraph)).toBe(CUT.cap);
        expect(first).toBe('## A heading\n\nThe first sentence holds some words.');
      });

      it('should travel with the paragraph before it, when nothing follows', () => {
        expect(
          markdownTextsOf('The first.\n\n# A heading\n\nThe second.\n\n## The end')
        ).toStrictEqual(['The first.', '# A heading\n\nThe second.\n\n## The end']);
      });

      it('should travel with the next heading and its paragraph, when no paragraph is between them', () => {
        expect(
          markdownTextsOf('The first.\n\n# A title\n\n## A heading\n\nThe second.')
        ).toStrictEqual(['The first.', '# A title\n\n## A heading\n\nThe second.']);
      });

      it('should see a heading with no text as a boundary', () => {
        expect(markdownTextsOf('The first.\n#\nThe second.')).toStrictEqual([
          'The first.',
          '#\nThe second.'
        ]);
      });

      it('should give a file of headings alone as one Chunk, as there is nothing to join', () => {
        expect(markdownTextsOf('# A title\n\n## A heading\n')).toStrictEqual([
          '# A title\n\n## A heading'
        ]);
      });

      it('should give no Chunk that spans two sections, even under the minimum', () => {
        const long = aParagraphOf(1150);

        expect(
          markdownTextsOf(`# A heading\n\n${long}\n\n# The next\n\nShort.`)
        ).toStrictEqual([`# A heading\n\n${long}`, '# The next\n\nShort.']);
      });
    });

    describe('a fenced code block', () => {
      it('should be one passage, and a blank line inside it is not a paragraph break', () => {
        const [first, second] = [650, 650].map(aParagraphOf);
        const fence = `\`\`\`\n${first}\n\n${second}\n\`\`\``;

        expect(markdownTextsOf(`The code.\n\n${fence}`)).toStrictEqual([
          `The code.\n\n${fence}`
        ]);
        expect(textsOf(`The code.\n\n${fence}`)).toHaveLength(2);
      });

      it('should hold a line that opens with # as code, and not as a heading', () => {
        const fence = '~~~sh\n# The check at dusk\n\ntest-the-lamp\n~~~';

        expect(markdownTextsOf(`Run it:\n\n${fence}`)).toStrictEqual([
          `Run it:\n\n${fence}`
        ]);
      });
    });

    describe('a list', () => {
      it('should be paragraphs like any other', () => {
        const [first, second, third] = [500, 500, 500].map(
          size => `- ${aParagraphOf(size - 2)}`
        );

        expect(markdownTextsOf(`${first}\n\n${second}\n\n${third}`)).toStrictEqual([
          `${first}\n\n${second}`,
          third
        ]);
      });
    });

    describe('a PDF', () => {
      const cutThePages = (pages: string[]): ChunkPrimitives[] =>
        cutter
          .cut({resourceId, contentType: 'pdf', texts: pages})
          .map(chunk => chunk.toPrimitives());

      it('should give each Chunk the number of its page, and join no two pages', () => {
        const pages = [
          'Page one of the fixture.\nAn extractor reads this text.',
          'Page two of the fixture.\nIts text differs from page one.'
        ];

        expect(cutThePages(pages)).toMatchObject([
          {text: pages[0], page: 1},
          {text: pages[1], page: 2}
        ]);
      });

      it('should keep the page of a Chunk after a page with no text', () => {
        expect(cutThePages(['', 'The second page.'])).toMatchObject([
          {text: 'The second page.', page: 2, position: 0}
        ]);
      });

      it('should give the positions in order across the pages', () => {
        expect(
          cutThePages(['The first page.', 'The second page.']).map(
            ({position}) => position
          )
        ).toStrictEqual([0, 1]);
      });

      it('should cut a page by sentence at the target, and not by paragraph', () => {
        const sentences = Array.from(
          {length: 30},
          (_, index) => `The sentence number ${index} holds a few more words.`
        );
        const page = sentences.join(' ');

        const chunks = cutThePages([page]).map(({text}) => text);

        expect(codePointsOf(page)).toBeGreaterThan(CUT.target);
        expect(codePointsOf(page)).toBeLessThanOrEqual(CUT.cap);
        expect(chunks).toHaveLength(2);

        for (const chunk of chunks) {
          expect(codePointsOf(chunk)).toBeLessThanOrEqual(CUT.target);
          expect(chunk.endsWith('words.')).toBe(true);
        }
      });

      it('should cut a sentence over the cap at the cap, and keep each piece on its page', () => {
        const digits = '7'.repeat(CUT.cap + 300);

        expect(
          cutThePages(['The first page.', digits]).map(({text, page}) => ({
            size: codePointsOf(text),
            page
          }))
        ).toStrictEqual([
          {size: codePointsOf('The first page.'), page: 1},
          {size: CUT.cap, page: 2},
          {size: 300, page: 2}
        ]);
      });

      it('should keep the newlines and the hyphens of a page', () => {
        const page = 'A line that the PDF\nbreaks in two, with a hyphen-\nat the end.';

        expect(cutThePages([page])).toMatchObject([{text: page}]);
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
