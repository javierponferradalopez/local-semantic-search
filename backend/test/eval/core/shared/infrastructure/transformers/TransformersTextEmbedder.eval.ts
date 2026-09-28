import {AutoTokenizer, type PreTrainedTokenizer} from '@huggingface/transformers';
import {CUT} from '../../../../../../src/core/ingestion/domain/Cut';
import {
  readFromTheModelStore,
  refuseAMissingModel
} from '../../../../../../src/core/shared/infrastructure/transformers/modelStore';
import {TEXT_MODEL} from '../../../../../../src/core/shared/infrastructure/transformers/TextModel';
import {runEval} from '../../../../../lib/runEval';

// The adapter gives the model these tokens for a Chunk that fits in one window.
const PASSAGE_PREFIX = 'passage: ';

// The kinds of content of issue #26, each repeated to the length of the cap.
const SAMPLES = {
  'Spanish prose':
    'La biblioteca guarda cada archivo que el propietario añade, y lo lee para que más tarde pueda encontrarlo por lo que dice y no por su nombre. Un informe escaneado no tiene texto, así que la fila lo dice y no miente. ',
  'English prose':
    'The library keeps every file that the owner adds, and reads it so that later it can be found by what it says and not by its name. A scanned report has no text, so the row says so and does not lie. ',
  Markdown:
    '## Retry\n\n- Press **Retry** on a `Failed` row.\n- See [the ADR](https://github.com/javierponferradalopez/local-semantic-search/blob/master/docs/adr/0014-the-cut-belongs-to-no-model.md).\n\n| Reason | Action |\n|---|---|\n| `no_text_found` | OCR the scan |\n\n',
  'source code':
    'const windowsOf = (ids: readonly number[], size: number): number[][] => {\n  const count = Math.max(1, Math.ceil(ids.length / size));\n  return Array.from({length: count}, (_, i) => ids.slice(i * size, (i + 1) * size));\n};\nSELECT id, text FROM chunks WHERE resource_id = $1 ORDER BY position;\n',
  'a table of numbers':
    'INV-2026-0417  12/03/2026  4.312,50 EUR  21 %  905,63  5.218,13\nINV-2026-0418  13/03/2026  17,99 EUR  10 %  1,80  19,79\n',
  'PDF-extracted text':
    'El sistema lee el archivo, corta el texto en frag-\nmentos y guarda cada fragmento con su vector.\nUna página escaneada no da texto, y el docu-\nmento queda marcado como fallido.\n',
  digits: '31415926535897932384626433832795028841971693993751058209749445923078164062862',
  'a string with no spaces':
    'aHR0cHM6Ly9naXRodWIuY29tL2phdmllcnBvbmZlcnJhZGFsb3Blei9sb2NhbC1zZW1hbnRpYy1zZWFyY2g',
  'characters the vocabulary does not know': '𓀀 𓀁 𓀂 𓀃 𓀄 𓀅 𓀆 𓀇 𓀈 𓀉 𓀊 𓀋 𓀌 𓀍 𓀎 𓀏 '
};

type Kind = keyof typeof SAMPLES;

// The output is the count of tokens, and the expected value is the wall.
type Count = {output: number; expected: number};

const fitsTheWall = ({output, expected}: Count): number => (output <= expected ? 1 : 0);

const shareOfTheWall = ({output, expected}: Count): number => output / expected;

const atTheCap = (sample: string): string => {
  const codePoints = Array.from(sample);
  const repeated = Array.from(
    {length: CUT.cap},
    (_, index) => codePoints[index % codePoints.length]
  );

  return repeated.join('');
};

let tokenizer: PreTrainedTokenizer | undefined;

// The tokenizer that bootstrap fetched, and never the weights: a count of tokens needs no model.
const theTokenizer = async (): Promise<PreTrainedTokenizer> => {
  readFromTheModelStore();
  await refuseAMissingModel(TEXT_MODEL.repository);
  tokenizer ??= await AutoTokenizer.from_pretrained(TEXT_MODEL.repository);

  return tokenizer;
};

// ADR-0014: the cap in code points fits the wall of tokens, or the adapter cuts windows.
runEval<Kind, number, number>('the-cap-fits-the-wall-of-tokens', {
  data: async () => {
    const wall = (await theTokenizer()).model_max_length;

    return Object.keys(SAMPLES).map(kind => ({input: kind as Kind, expected: wall}));
  },
  task: async (kind: Kind): Promise<number> => {
    const text = `${PASSAGE_PREFIX}${atTheCap(SAMPLES[kind])}`;

    return (await theTokenizer()).encode(text).length;
  },
  scorers: [
    {name: 'fits the wall', score: fitsTheWall},
    {name: 'share of the wall', score: shareOfTheWall}
  ]
});
