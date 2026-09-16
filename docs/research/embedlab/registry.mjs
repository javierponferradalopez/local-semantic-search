// Probe 1. Which text-encoder architectures does the installed library know?
// Reads the installed source, so the answer is about this exact version.
import { readdirSync, readFileSync, existsSync } from 'node:fs';



const pkgPath = new URL('./node_modules/@huggingface/transformers/package.json', import.meta.url).pathname;
const root = pkgPath.replace(/\/package\.json$/, '');
const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));

console.log('package version =', pkg.version);
console.log('dependencies =', JSON.stringify(pkg.dependencies));

const modelsDir = `${root}/src/models`;
const dirs = existsSync(modelsDir)
  ? readdirSync(modelsDir, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name)
  : [];
console.log('src/models directories =', dirs.length);

// The architectures a text embedder in this study can declare in config.json.
const WANTED = [
  'bert', 'roberta', 'xlm_roberta', 'nomic_bert', 'jina_bert', 'jina_clip',
  'mpnet', 'distilbert', 'deberta', 'deberta_v2', 'gemma3_text', 'gemma3',
  'qwen3', 'modernbert', 'new', 'model2vec', 'static', 'neobert',
];
for (const a of WANTED) console.log(`  ${a.padEnd(16)} ${dirs.includes(a) ? 'present' : '-'}`);

// The registry maps model_type -> class. Read it if it is shipped.
for (const f of ['src/models/registry.js', 'src/models.js']) {
  const p = `${root}/${f}`;
  if (!existsSync(p)) continue;
  const src = readFileSync(p, 'utf8');
  const hits = [...src.matchAll(/^\s*\['([a-z0-9_-]+)',/gm)].map((m) => m[1]);
  console.log(`\n${f}: ${hits.length} registry keys`);
  const uniq = [...new Set(hits)].sort();
  console.log(uniq.join(' '));
  break;
}
