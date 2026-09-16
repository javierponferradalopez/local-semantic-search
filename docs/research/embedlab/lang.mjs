// Probe 5. Spanish and English.
// Run as: node lang.mjs <key> <dtype> [noprefix]
// Ten facts, each written in Spanish and in English, each with a query in
// Spanish and a query in English. Four separate retrieval tasks:
//   es->es  a Spanish query over the ten Spanish passages   (the owner's case)
//   en->en  an English query over the ten English passages  (the control)
//   es->en  a Spanish query over the ten English passages   (cross-language)
//   mixed   a Spanish query over all twenty passages
// The score reported is recall@1 and mean reciprocal rank.
// This is a probe, not a benchmark. Twenty passages measure nothing about MTEB.
import { byKey, cos, FACTS, PASSAGES, QUERIES } from './common.mjs';
import { makeEmbedder } from './embed.mjs';

const [key, dtype = 'fp32', mode = 'prefix'] = process.argv.slice(2);
const c = byKey(key);
const { embed } = await makeEmbedder(c, dtype);

const dp = mode === 'noprefix' ? '' : (c.dp ?? '');
const qp = mode === 'noprefix' ? '' : (c.qp ?? '');

const pv = new Map();
for (const p of PASSAGES) pv.set(p.id, (await embed([dp + p.text]))[0]);
const qv = new Map();
for (const q of QUERIES) qv.set(q.id, (await embed([qp + q.text]))[0]);

function rank(queryId, pool) {
  const v = qv.get(queryId);
  return pool
    .map((p) => ({ id: p.id, fact: p.fact, s: cos(v, pv.get(p.id)) }))
    .sort((a, b) => b.s - a.s);
}

const es = PASSAGES.filter((p) => p.lang === 'es');
const en = PASSAGES.filter((p) => p.lang === 'en');

function task(queryLang, pool, wantLang) {
  let hits = 0;
  let mrr = 0;
  const misses = [];
  for (const f of FACTS) {
    const qid = queryLang === 'es' ? `qes-${f.id}` : `qen-${f.id}`;
    const r = rank(qid, pool);
    const pos = r.findIndex((x) => x.id === `${wantLang}-${f.id}`) + 1;
    if (pos === 1) hits++;
    else misses.push(`${qid} -> ${r[0].id} (wanted rank ${pos})`);
    mrr += 1 / pos;
  }
  return { recall_at_1: `${hits}/${FACTS.length}`, mrr: +(mrr / FACTS.length).toFixed(3), misses };
}

const out = { key, id: c.id, dtype, mode, dim: pv.get(PASSAGES[0].id).length };
out.es_to_es = task('es', es, 'es');
out.en_to_en = task('en', en, 'en');
out.es_to_en = task('es', en, 'en');
out.en_to_es = task('en', es, 'es');

// The mixed pool. A Spanish query over all twenty passages: where does the
// right Spanish passage land, and where does its English twin land?
out.mixed = FACTS.map((f) => {
  const r = rank(`qes-${f.id}`, PASSAGES);
  return {
    fact: f.id,
    rank_es: r.findIndex((x) => x.id === `es-${f.id}`) + 1,
    rank_en_twin: r.findIndex((x) => x.id === `en-${f.id}`) + 1,
    top1: r[0].id,
    top_score: +r[0].s.toFixed(4),
    bottom_score: +r[r.length - 1].s.toFixed(4),
  };
});
out.mixed_recall_at_1 = `${out.mixed.filter((m) => m.rank_es === 1).length}/${FACTS.length}`;
out.mixed_mean_spread = +(
  out.mixed.reduce((a, m) => a + (m.top_score - m.bottom_score), 0) / FACTS.length
).toFixed(4);
console.log(JSON.stringify(out));
