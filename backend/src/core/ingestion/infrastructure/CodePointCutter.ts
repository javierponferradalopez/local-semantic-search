import type {ContentType} from 'contract/ContentType';
import type {ResourceId} from '../../resources/domain/value-objects/ResourceId';
import {Chunk} from '../domain/Chunk';
import {CUT} from '../domain/Cut';
import type {Cutter} from '../domain/Cutter';
import {ChunkText} from '../domain/value-objects/ChunkText';

type CutParams = {
  resourceId: ResourceId;
  contentType: ContentType;
  texts: readonly string[];
};

// Each piece keeps the whitespace that follows it, so the pieces joined give the text back.
type Split = (text: string) => string[];

const BLANK_LINE = /\n\s*\n/g;
const BLANK = /^\s*$/;
const LINES = /[^\n]*\n|[^\n]+$/g;
const HEADING = /^ {0,3}#{1,6}(?:\s|$)/;
const FENCE = /^ {0,3}(`{3,}|~{3,})/;
const LETTER_OR_DIGIT = /[\p{L}\p{N}]/u;
const WHITESPACE = /\s/u;
const SENTENCES = new Intl.Segmenter('und', {granularity: 'sentence'});

const sizeOf = (text: string): number => Array.from(text.trim()).length;

const holdsALetterOrADigit = (text: string): boolean => LETTER_OR_DIGIT.test(text);

const paragraphsOf: Split = (text: string): string[] => {
  const paragraphs: string[] = [];
  let start = 0;

  for (const blankLine of text.matchAll(BLANK_LINE)) {
    const end = blankLine.index + blankLine[0].length;

    paragraphs.push(text.slice(start, end));
    start = end;
  }

  return [...paragraphs, text.slice(start)];
};

// The segmenter gives the newline after a line break alone, and it belongs to the sentence before it.
const sentencesOf: Split = (text: string): string[] => {
  const sentences: string[] = [];

  for (const {segment} of SENTENCES.segment(text)) {
    if (sentences.length > 0 && BLANK.test(segment)) {
      sentences[sentences.length - 1] += segment;
      continue;
    }

    sentences.push(segment);
  }

  return sentences;
};

const hardCutsOf: Split = (text: string): string[] => {
  const pieces: string[] = [];
  let rest = Array.from(text);

  while (rest.length > CUT.cap) {
    const lastWhitespace = rest
      .slice(0, CUT.cap)
      .findLastIndex(codePoint => WHITESPACE.test(codePoint));
    const end = lastWhitespace > 0 ? lastWhitespace + 1 : CUT.cap;

    pieces.push(rest.slice(0, end).join(''));
    rest = rest.slice(end);
  }

  return [...pieces, rest.join('')];
};

// The target, the minimum and the cap of ADR-0014.
const accumulate = (passages: readonly string[]): string[] => {
  const pieces: string[] = [];
  let current = '';

  const close = (): void => {
    const previous = pieces.at(-1);

    if (
      previous !== undefined &&
      sizeOf(current) < CUT.minimum &&
      sizeOf(previous + current) <= CUT.cap
    ) {
      pieces[pieces.length - 1] = previous + current;
      return;
    }

    pieces.push(current);
  };

  for (const passage of passages) {
    const joined = sizeOf(current + passage);
    const joinsTheTarget = joined <= CUT.target;
    const joinsASmallOne = sizeOf(current) < CUT.minimum && joined <= CUT.cap;

    if (current === '' || joinsTheTarget || joinsASmallOne) {
      current += passage;
      continue;
    }

    close();
    current = passage;
  }

  if (current !== '') {
    close();
  }

  return pieces;
};

const underTheCap = (
  passages: readonly string[],
  lowerRungs: readonly Split[]
): string[] =>
  accumulate(
    passages.flatMap(passage =>
      sizeOf(passage) <= CUT.cap ? [passage] : piecesOf(passage, lowerRungs)
    )
  );

// The first rung always splits, so that short paragraphs accumulate to the target.
const piecesOf = (text: string, [split, ...lowerRungs]: readonly Split[]): string[] =>
  underTheCap(split(text).filter(holdsALetterOrADigit), lowerRungs);

const LOWER_RUNGS: readonly Split[] = [sentencesOf, hardCutsOf];
const PLAIN_TEXT_LADDER: readonly Split[] = [paragraphsOf, ...LOWER_RUNGS];

type Block = {text: string; isHeading: boolean};

type Section = {heading: string; passages: string[]};

const closingFenceOf = (opening: string): RegExp =>
  new RegExp(`^ {0,3}${opening[0]}{${opening.length},}\\s*$`);

// A fenced code block is one block, with the blank lines inside it (ADR-0014).
const blocksOf = (text: string): Block[] => {
  const blocks: Block[] = [];
  let closingFence: RegExp | undefined;
  let blockEnded = true;

  for (const line of text.match(LINES) ?? []) {
    const current = blocks.at(-1);

    if (closingFence !== undefined && current !== undefined) {
      current.text += line;
      blockEnded = closingFence.test(line);
      closingFence = blockEnded ? undefined : closingFence;
      continue;
    }

    const fence = FENCE.exec(line)?.[1];
    const isHeading = fence === undefined && HEADING.test(line);
    const isBlank = BLANK.test(line);
    const continues = !blockEnded && fence === undefined && !isHeading;

    if (current !== undefined && (isBlank || continues)) {
      current.text += line;
      blockEnded ||= isBlank;
      continue;
    }

    blocks.push({text: line, isHeading});
    closingFence = fence === undefined ? undefined : closingFenceOf(fence);
    blockEnded = isHeading;
  }

  return blocks;
};

const sectionsOf = (text: string): Section[] =>
  blocksOf(text).reduce<Section[]>(
    (sections, {text: block, isHeading}) => {
      if (isHeading) {
        sections.push({heading: block, passages: []});
      } else {
        sections.at(-1)?.passages.push(block);
      }

      return sections;
    },
    [{heading: '', passages: []}]
  );

// Headings with no paragraph wait for the next one; at the end, they join the one before (ADR-0014).
const markdownPiecesOf = (text: string): string[] => {
  const pieces: string[] = [];
  let headings = '';

  for (const {heading, passages} of sectionsOf(text)) {
    const [first, ...rest] = passages.filter(holdsALetterOrADigit);

    headings += heading;

    if (first !== undefined) {
      pieces.push(...underTheCap([headings + first, ...rest], LOWER_RUNGS));
      headings = '';
    }
  }

  if (!holdsALetterOrADigit(headings)) {
    return pieces;
  }

  const last = pieces.at(-1);

  return last !== undefined && sizeOf(last + headings) <= CUT.cap
    ? [...pieces.slice(0, -1), last + headings]
    : [...pieces, headings];
};

type CutOfAContentType = {piecesOf: (text: string) => string[]; hasPages: boolean};

// A PDF has no paragraph to trust, so its ladder starts at the sentence (ADR-0014).
const CUT_OF: Record<ContentType, CutOfAContentType> = {
  pdf: {piecesOf: (text: string) => piecesOf(text, LOWER_RUNGS), hasPages: true},
  plain_text: {
    piecesOf: (text: string) => piecesOf(text, PLAIN_TEXT_LADDER),
    hasPages: false
  },
  markdown: {piecesOf: markdownPiecesOf, hasPages: false}
};

export class CodePointCutter implements Cutter {
  public cut({resourceId, contentType, texts}: CutParams): Chunk[] {
    const {piecesOf: piecesOfAText, hasPages} = CUT_OF[contentType];

    return texts
      .flatMap((text, index) =>
        piecesOfAText(text).map(piece => ({
          piece,
          page: hasPages ? index + 1 : undefined
        }))
      )
      .map(({piece, page}, position) =>
        Chunk.create({
          resourceId,
          text: ChunkText.of({value: piece}),
          page,
          position
        })
      );
  }
}
