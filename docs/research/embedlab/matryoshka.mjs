// Probe 7. Does Matryoshka truncation really work?
// Run as: node matryoshka.mjs <key> <dtype>
// The claim on a model card is "cut the vector and renormalise it". This
// script cuts it, renormalises it, and then checks two things:
//   * how close the short vector stays to the full one, on real text;
//   * whether the ranking over the probe set survives the cut.
// A model with no Matryoshka training is measured the same way, as a control:
// the numbers show what a plain cut costs when the model never trained for it.
import { byKey, cos, PASSAGES, QUERIES, truncateAndRenormalise } from './common.mjs';
import { makeEmbedder } from './embed.mjs';

const [key, dtype = 'fp32'] = process.argv.slice(2);
const c = byKey(key);
const { embed } = await makeEmbedder(c, dtype);

const dp = c.dp ?? '';
const qp = c.qp ?? '';
const pvecs = [];
for (const p of PASSAGES) pvecs.push((await embed([dp + p.text]))[0]);
const qvecs = [];
for (const q of QUERIES) qvecs.push((await embed([qp + q.text]))[0]);

const full = pvecs[0].length;
const widths = (c.matryoshka ?? [64, 128, 256, 512]).filter((n) => n < full).concat([full]);

const wantOf = (q) => `${q.lang}-${q.fact}`;

function ranking(qv, ps) {
  return PASSAGES.map((p, i) => ({ id: p.id, s: cos(qv, ps[i]) }))
    .sort((a, b) => b.s - a.s)
    .map((x) => x.id);
}

const base = qvecs.map((qv) => ranking(qv, pvecs));

const out = { key, id: c.id, dtype, full_dim: full, claimed: c.matryoshka ?? null, widths: {} };
for (const n of widths) {
  const ps = pvecs.map((v) => truncateAndRenormalise(v, n));
  const qs = qvecs.map((v) => truncateAndRenormalise(v, n));
  const rs = qs.map((qv) => ranking(qv, ps));
  let same = 0;
  let sameTop = 0;
  for (let i = 0; i < rs.length; i++) {
    if (rs[i].join('>') === base[i].join('>')) same++;
    if (rs[i][0] === base[i][0]) sameTop++;
  }
  // Cosine between the cut passage vector and the cut vector of the same text,
  // measured against the full-width ranking instead: here we report how much
  // the pairwise similarity moves.
  let drift = 0;
  let pairs = 0;
  for (let i = 0; i < qvecs.length; i++) {
    for (let j = 0; j < pvecs.length; j++) {
      drift += Math.abs(cos(qs[i], ps[j]) - cos(qvecs[i], pvecs[j]));
      pairs++;
    }
  }
  out.widths[n] = {
    identical_ranking: `${same}/${rs.length}`,
    same_top1: `${sameTop}/${rs.length}`,
    mean_abs_score_shift: +(drift / pairs).toFixed(4),
    hits_at_1: `${rs.filter((r, i) => r[0] === wantOf(QUERIES[i])).length}/${QUERIES.length}`,
  };
}
console.log(JSON.stringify(out));
