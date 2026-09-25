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

const sentencesOf: Split = (text: string): string[] =>
  Array.from(SENTENCES.segment(text), ({segment}) => segment);

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

const PLAIN_TEXT_LADDER: readonly Split[] = [paragraphsOf, sentencesOf, hardCutsOf];

const ladderOf = (contentType: ContentType): readonly Split[] => {
  if (contentType !== 'plain_text') {
    throw new Error(`The cut of the Content type ${contentType} is not built`);
  }

  return PLAIN_TEXT_LADDER;
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

// The first rung always splits, so that short paragraphs accumulate to the target.
const piecesOf = (text: string, [split, ...lowerRungs]: readonly Split[]): string[] =>
  accumulate(
    split(text)
      .filter(holdsALetterOrADigit)
      .flatMap(passage =>
        sizeOf(passage) <= CUT.cap ? [passage] : piecesOf(passage, lowerRungs)
      )
  );

export class CodePointCutter implements Cutter {
  public cut({resourceId, contentType, texts}: CutParams): Chunk[] {
    const ladder = ladderOf(contentType);

    return texts
      .flatMap(text => piecesOf(text, ladder))
      .map((piece, position) =>
        Chunk.create({
          resourceId,
          text: ChunkText.of({value: piece}),
          page: undefined,
          position
        })
      );
  }
}
