// Probe 2. What the Hub says about each candidate, before anything is loaded.
// Licence, architecture, ONNX files present, and the size of each file.
// Output: hub.json (raw) plus a table on stdout.
import { writeFileSync } from 'node:fs';

const IDS = [
  'Xenova/all-MiniLM-L6-v2',
  'sentence-transformers/all-MiniLM-L6-v2',
  'Xenova/bge-small-en-v1.5',
  'Xenova/bge-base-en-v1.5',
  'BAAI/bge-small-en-v1.5',
  'BAAI/bge-base-en-v1.5',
  'BAAI/bge-m3',
  'Xenova/gte-small',
  'Xenova/gte-base',
  'Alibaba-NLP/gte-multilingual-base',
  'onnx-community/gte-multilingual-base-ONNX',
  'Xenova/e5-small-v2',
  'Xenova/multilingual-e5-small',
  'Xenova/multilingual-e5-base',
  'intfloat/multilingual-e5-small',
  'intfloat/multilingual-e5-base',
  'intfloat/multilingual-e5-large',
  'nomic-ai/nomic-embed-text-v1.5',
  'nomic-ai/nomic-embed-text-v2-moe',
  'Snowflake/snowflake-arctic-embed-s',
  'Snowflake/snowflake-arctic-embed-m',
  'Snowflake/snowflake-arctic-embed-m-v1.5',
  'Snowflake/snowflake-arctic-embed-m-v2.0',
  'Snowflake/snowflake-arctic-embed-l-v2.0',
  'Xenova/snowflake-arctic-embed-s',
  'jinaai/jina-embeddings-v2-small-en',
  'jinaai/jina-embeddings-v2-base-en',
  'jinaai/jina-embeddings-v2-base-es',
  'jinaai/jina-embeddings-v2-base-code',
  'jinaai/jina-embeddings-v3',
  'onnx-community/jina-embeddings-v3',
  'Xenova/paraphrase-multilingual-MiniLM-L12-v2',
  'sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2',
  'sentence-transformers/static-retrieval-mrl-en-v1',
  'sentence-transformers/static-similarity-mrl-multilingual-v1',
  'google/embeddinggemma-300m',
  'onnx-community/embeddinggemma-300m-ONNX',
  'onnx-community/Qwen3-Embedding-0.6B-ONNX',
  'Qwen/Qwen3-Embedding-0.6B',
  'mixedbread-ai/mxbai-embed-large-v1',
  'ibm-granite/granite-embedding-107m-multilingual',
  'ibm-granite/granite-embedding-278m-multilingual',
  'ibm-granite/granite-embedding-english-r2',
  'minishlab/potion-multilingual-128M',
  'minishlab/potion-base-8M',
];

const out = {};
for (const id of IDS) {
  const rec = { id };
  try {
    const r = await fetch(`https://huggingface.co/api/models/${id}?blobs=true`);
    if (!r.ok) {
      rec.error = `HTTP ${r.status}`;
      out[id] = rec;
      console.log(`${id.padEnd(58)} ${rec.error}`);
      continue;
    }
    const j = await r.json();
    rec.license = j.cardData?.license ?? j.tags?.find((t) => t.startsWith('license:')) ?? null;
    rec.license_name = j.cardData?.license_name ?? null;
    rec.downloads30d = j.downloads ?? null;
    rec.likes = j.likes ?? null;
    rec.tags = (j.tags ?? []).filter((t) => ['transformers.js', 'onnx', 'sentence-transformers'].includes(t));
    rec.pipeline = j.pipeline_tag ?? null;
    const files = (j.siblings ?? []).map((s) => s.rfilename);
    rec.onnx = files.filter((f) => f.endsWith('.onnx') || f.endsWith('.onnx_data'));
    rec.sizes = {};
    for (const s of j.siblings ?? []) {
      if (rec.onnx.includes(s.rfilename) && s.size != null) rec.sizes[s.rfilename] = s.size;
    }
    // config.json tells us the architecture and the position table
    const c = await fetch(`https://huggingface.co/${id}/raw/main/config.json`);
    if (c.ok) {
      const cfg = await c.json();
      rec.model_type = cfg.model_type ?? null;
      rec.hidden_size = cfg.hidden_size ?? cfg.d_model ?? null;
      rec.max_position_embeddings = cfg.max_position_embeddings ?? null;
      rec.auto_map = cfg.auto_map ? Object.keys(cfg.auto_map) : null;
    }
    const t = await fetch(`https://huggingface.co/${id}/raw/main/tokenizer_config.json`);
    if (t.ok) {
      const tc = await t.json();
      rec.tokenizer_model_max_length = tc.model_max_length ?? null;
      rec.tokenizer_class = tc.tokenizer_class ?? null;
    }
  } catch (e) {
    rec.error = String(e).slice(0, 200);
  }
  out[id] = rec;
  console.log(
    `${id.padEnd(58)} lic=${String(rec.license).padEnd(14)} type=${String(rec.model_type).padEnd(14)} dim=${String(rec.hidden_size).padEnd(5)} maxpos=${String(rec.max_position_embeddings).padEnd(6)} tokmax=${String(rec.tokenizer_model_max_length).padEnd(8)} onnx=${rec.onnx?.length ?? 0} tags=${rec.tags?.join(',')}`,
  );
}
writeFileSync('hub.json', `${JSON.stringify(out, null, 2)}\n`);
console.log('\nwrote hub.json');
