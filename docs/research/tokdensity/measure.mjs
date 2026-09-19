// Research #26: how many characters a token holds.
// Loads only tokenizers (never weights), tokenizes every sample of the corpus
// with each one, and writes one JSON line per measurement to out.jsonl.
// Run: node measure.mjs
import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { AutoTokenizer, env } from '@huggingface/transformers';

env.cacheDir = new URL('./.cache/', import.meta.url).pathname;
env.allowLocalModels = false;

const HERE = new URL('./', import.meta.url).pathname;
const CORPUS = `${HERE}corpus/`;
const OUT = `${HERE}out.jsonl`;
const LIMIT = 512;
const CAPS = [600, 800, 1000, 1200, 1500, 1800, 2000, 2500];

const TOKENIZERS = [
  { key: 'e5', id: 'Xenova/multilingual-e5-small', prefix: 'passage: ' },
  { key: 'granite', id: 'ibm-granite/granite-embedding-97m-multilingual-r2', prefix: '' },
  { key: 'minilm', id: 'Xenova/all-MiniLM-L6-v2', prefix: '' },
];

const KIND_LABEL = {
  'es-prose': 'Spanish prose',
  'en-prose': 'English prose',
  markdown: 'Markdown',
  numbers: 'Numbers table',
  code: 'Source code',
  pdf: 'PDF-extracted text',
  pathological: 'Pathological',
};
const KIND_ORDER = ['es-prose', 'en-prose', 'markdown', 'numbers', 'code', 'pdf', 'pathological'];

// --- corpus -----------------------------------------------------------------
// The pathological samples are generated, not written: a seeded LCG so that
// every run sees the same string.
function lcg(seed) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
}
function pathological() {
  const dir = `${CORPUS}pathological/`;
  mkdirSync(dir, { recursive: true });
  const b64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const r1 = lcg(26);
  const r2 = lcg(512);
  const base64 = Array.from({ length: 3000 }, () => b64[Math.floor(r1() * 64)]).join('');
  const digits = Array.from({ length: 3000 }, () => String(Math.floor(r2() * 10))).join('');
  writeFileSync(`${dir}base64.txt`, base64);
  writeFileSync(`${dir}digits.txt`, digits);
}

function loadCorpus() {
  pathological();
  const samples = [];
  for (const kind of KIND_ORDER) {
    const dir = `${CORPUS}${kind}/`;
    if (!existsSync(dir)) continue;
    for (const file of readdirSync(dir).filter((f) => f.endsWith('.txt')).sort()) {
      const text = readFileSync(dir + file, 'utf8').replace(/\n$/, '');
      samples.push({ kind, name: `${kind}/${file}`, text });
    }
  }
  return samples;
}

// --- helpers ----------------------------------------------------------------
const cp = (s) => Array.from(s).length; // Unicode code points
const sliceCp = (s, n) => Array.from(s).slice(0, n).join('');
const round = (x, d = 2) => (x == null ? null : +x.toFixed(d));

function count(tok, text, add_special_tokens = false) {
  return tok.encode(text, { add_special_tokens }).length;
}

const lines = [];
const emit = (rec) => lines.push(JSON.stringify(rec));

// --- main -------------------------------------------------------------------
const transformersVersion = JSON.parse(
  readFileSync(`${HERE}node_modules/@huggingface/transformers/package.json`, 'utf8'),
).version;
emit({ type: 'run', at: new Date().toISOString(), node: process.version, transformers: transformersVersion, limit: LIMIT });

const samples = loadCorpus();
for (const s of samples) emit({ type: 'sample', name: s.name, kind: s.kind, chars: cp(s.text), utf16: s.text.length });

const loaded = [];
for (const t of TOKENIZERS) {
  try {
    const tok = await AutoTokenizer.from_pretrained(t.id);
    const probe = 'hello world';
    const withIds = tok.encode(probe, { add_special_tokens: true });
    const without = tok.encode(probe, { add_special_tokens: false });
    const specials = withIds.length - without.length;
    const specialIds = withIds.filter((id) => !without.includes(id));
    const specialText = specialIds.map((id) => tok.decode([id]));
    // Two readings of the prefix cost: the prefix alone, and the prefix in
    // front of real text (SentencePiece may merge the trailing space).
    const prefixAlone = t.prefix ? count(tok, t.prefix) : 0;
    const prefixDeltas = t.prefix
      ? samples.filter((s) => s.kind.endsWith('prose')).map((s) => count(tok, t.prefix + s.text) - count(tok, s.text))
      : [0];
    const prefixInFront = Math.max(...prefixDeltas);
    const wall = LIMIT - specials - prefixInFront;
    const info = {
      type: 'tokenizer',
      key: t.key,
      id: t.id,
      ok: true,
      model_max_length: tok.model_max_length,
      tokenizer_class: tok.constructor.name,
      specials,
      special_tokens: specialText,
      prefix: t.prefix,
      prefix_tokens_alone: prefixAlone,
      prefix_tokens_in_front: prefixInFront,
      prefix_tokens_in_front_all: [...new Set(prefixDeltas)],
      wall,
    };
    emit(info);
    loaded.push({ ...t, tok, ...info });
  } catch (err) {
    emit({ type: 'tokenizer', key: t.key, id: t.id, ok: false, error: String(err?.message ?? err) });
    console.error(`FAILED ${t.id}: ${err?.message ?? err}`);
  }
}

// --- per sample -------------------------------------------------------------
const rows = [];
for (const t of loaded) {
  for (const s of samples) {
    const tokens = count(t.tok, s.text);
    const chars = cp(s.text);
    const row = {
      type: 'measure',
      tokenizer: t.key,
      kind: s.kind,
      sample: s.name,
      chars,
      utf16: s.text.length,
      tokens,
      cpt: round(chars / tokens, 3),
    };
    rows.push(row);
    emit(row);
  }
}

// --- per tokenizer x kind ---------------------------------------------------
const summary = [];
for (const t of loaded) {
  for (const kind of KIND_ORDER) {
    const rs = rows.filter((r) => r.tokenizer === t.key && r.kind === kind);
    if (!rs.length) continue;
    const cpts = rs.map((r) => r.cpt);
    const min = Math.min(...cpts);
    const max = Math.max(...cpts);
    const mean = cpts.reduce((a, b) => a + b, 0) / cpts.length;
    const worst = rs.find((r) => r.cpt === min);
    const rec = {
      type: 'kind',
      tokenizer: t.key,
      kind,
      n: rs.length,
      mean_cpt: round(mean),
      min_cpt: round(min),
      max_cpt: round(max),
      worst_sample: worst.sample,
      wall: t.wall,
      safe_chars: Math.floor(t.wall * min),
    };
    summary.push(rec);
    emit(rec);
  }
}

// --- decision table ---------------------------------------------------------
// Two readings for each cap: the ratio-based one (cap / min chars-per-token of
// the kind) and a direct one (tokens of the first N code points of each sample
// that is at least N long; the max over samples is the worst).
for (const t of loaded) {
  for (const kind of KIND_ORDER) {
    const ss = samples.filter((s) => s.kind === kind);
    if (!ss.length) continue;
    const k = summary.find((x) => x.tokenizer === t.key && x.kind === kind);
    for (const cap of CAPS) {
      const long = ss.filter((s) => cp(s.text) >= cap);
      const direct = long.length ? Math.max(...long.map((s) => count(t.tok, sliceCp(s.text, cap)))) : null;
      emit({
        type: 'cap',
        tokenizer: t.key,
        kind,
        cap,
        wall: t.wall,
        ratio_tokens: Math.ceil(cap / k.min_cpt),
        ratio_fits: cap <= k.safe_chars,
        direct_samples: long.length,
        direct_max_tokens: direct,
        direct_fits: direct == null ? null : direct <= t.wall,
      });
    }
  }
}

// --- newlines and hyphens in PDF text ---------------------------------------
for (const t of loaded) {
  for (const s of samples.filter((x) => x.kind === 'pdf')) {
    const asIs = count(t.tok, s.text);
    const nlToSpace = count(t.tok, s.text.replace(/\n/g, ' '));
    const joinHyphen = count(t.tok, s.text.replace(/-\n/g, ''));
    const both = count(t.tok, s.text.replace(/-\n/g, '').replace(/\n/g, ' '));
    emit({
      type: 'pdf',
      tokenizer: t.key,
      sample: s.name,
      newlines: (s.text.match(/\n/g) || []).length,
      hyphen_breaks: (s.text.match(/-\n/g) || []).length,
      tokens_as_is: asIs,
      tokens_newline_to_space: nlToSpace,
      tokens_hyphen_joined: joinHyphen,
      tokens_both: both,
      delta_newline: nlToSpace - asIs,
      delta_hyphen: joinHyphen - asIs,
      delta_both: both - asIs,
    });
  }
}

writeFileSync(OUT, lines.join('\n') + '\n');

// --- console summary ----------------------------------------------------------
const pad = (v, w) => String(v).padStart(w);
for (const t of loaded) {
  console.log(`\n${t.key} (${t.id}) specials=${t.specials} prefix=${t.prefix_tokens_in_front} wall=${t.wall}`);
  console.log(`  ${'kind'.padEnd(22)} ${pad('n', 2)} ${pad('mean', 6)} ${pad('min', 6)} ${pad('max', 6)} ${pad('safe', 6)}  worst`);
  for (const k of summary.filter((x) => x.tokenizer === t.key)) {
    console.log(`  ${KIND_LABEL[k.kind].padEnd(22)} ${pad(k.n, 2)} ${pad(k.mean_cpt, 6)} ${pad(k.min_cpt, 6)} ${pad(k.max_cpt, 6)} ${pad(k.safe_chars, 6)}  ${k.worst_sample}`);
  }
}
console.log(`\nwrote ${lines.length} lines to ${OUT}`);
