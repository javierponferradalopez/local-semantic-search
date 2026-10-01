# Which lexical search Postgres can run next to the vectors

Research for issue #106 (map #94). Date: 2026-10-01. "Not verified" marks a claim that this research did not confirm in a primary source.

## Answer

Use the built-in full-text search of Postgres first: one `tsvector` column on `chunks` with the `simple` configuration and `unaccent`, a GIN index, and an OR query. It needs no new image, no new licence and no change of model. Fuse it with the dense stage by RRF on the best Chunk of each Resource, in one SQL statement. The Reranker then orders the fused list, so the weak ranking of `ts_rank_cd` (no IDF) is less important: the lexical stage must only bring the right Resource into the candidates. If the eval shows that the ranking of `ts_rank_cd` loses Resources, move to `pg_textsearch` (true BM25, PostgreSQL licence). Do not use `bge-m3` sparse vectors on this map: they replace the Text model, and model changes are out of scope.

## 1. Built-in `tsvector` / `tsquery`

- **Configurations.** `spanish` and `english` apply a Snowball stemmer and a stop-word list. `simple` only lowercases; it has no stemmer and no stop words. Docs: https://www.postgresql.org/docs/18/textsearch-configuration.html
- **Accents.** The `unaccent` extension is in `contrib`, and the official `postgres` image (the base of `pgvector/pgvector:pg18`) ships `contrib`. Make a configuration that copies `simple` and puts `unaccent` before the `simple` dictionary, so "canción" and "cancion" match. https://www.postgresql.org/docs/18/unaccent.html
- **Mixed corpus, three options.**
  1. `simple` + `unaccent`, one column. No stemming, so "gatos" does not match "gato". But exact terms, codes and names ("pgvector", "ISO-9001", "e5") stay intact, and that is the main reason to add a lexical stage. The dense stage already covers morphology.
  2. Two columns, `spanish` and `english`; query both and take the greater score. Stemming in both languages. Risk: the stemmer of the wrong language changes words of the other language. Two GIN indexes.
  3. Detect the language at ingest (for example the npm package `franc`) and store a `regconfig` per Chunk. This adds a domain fact (the language of a Chunk) that the store does not have. A short Query is too short to detect reliably, so the Query side must still use two configurations.
- **Recall trap.** `plainto_tsquery` and `websearch_to_tsquery` join the terms with AND. A Query of five words then matches almost nothing. For a first stage, make an OR query (`to_tsquery` with `|` between the lexemes) and let the ranking and the Reranker sort. Not verified on this corpus: measure it.
- **Ranking.** `ts_rank` and `ts_rank_cd` use term frequency and proximity, but no corpus statistics (no IDF), so a frequent word weighs as much as a rare one. https://www.postgresql.org/docs/18/textsearch-controls.html#TEXTSEARCH-RANKING. ParadeDB says the same: https://www.paradedb.com/blog/hybrid-search-in-postgresql-the-missing-manual
- **Index.** GIN on the `tsvector` column. A stored generated column keeps it in step with `chunks.text`.

## 2. BM25 extensions

| Extension | Licence | Image with pgvector, PG 18 | Maturity | Two languages |
|---|---|---|---|---|
| ParadeDB `pg_search` (Tantivy) | AGPL-3.0 | `paradedb/paradedb` (PG 14–18, pgvector included; not verified in the Dockerfile) | Active, 9k stars, v0.2x | Snowball stemmer per tokenizer, `spanish` included; ASCII folding filter |
| Timescale `pg_textsearch` | PostgreSQL licence | `timescale/timescaledb-ha` (pgvector, pgvectorscale, pg_textsearch; not verified for each tag) | v1.4.0, PG 17–18 | Uses Postgres text search configurations; per-language partial indexes |
| VectorChord-bm25 + `pg_tokenizer` | AGPL-3.0 or ELv2 (`pg_tokenizer`: Apache-2.0) | `tensorchord/vchord-suite:pg18-latest` (vchord, not pgvector; not verified) | Smaller, 379 stars | Model tokenizers (BERT, Gemma2), Jieba, Lindera; no Spanish stemmer named |

Sources: https://github.com/paradedb/paradedb, https://docs.paradedb.com/documentation/token-filters/stemming, https://github.com/timescale/pg_textsearch, https://www.tigerdata.com/docs/learn/tutorials/hybrid-search, https://github.com/tensorchord/VectorChord-bm25, https://github.com/tensorchord/pg_tokenizer.rs

Notes:
- AGPL is a fair fit for an open-source local product, but it binds anyone who changes and serves the extension. The PostgreSQL licence of `pg_textsearch` has no such cost.
- Each extension changes the Docker image away from `pgvector/pgvector:pg18`. `pg_textsearch` probably needs `shared_preload_libraries` (not verified).
- `pg_textsearch` stores no positions, so it has no phrase query. Its `text_config` is one configuration per index: the mixed-language problem of section 1 stays. With `simple` + `unaccent` it gives true BM25 on the same tokens.
- One search result says `pg_search` 0.25 needs pgvector (not verified).

## 3. Sparse vectors (`bge-m3`)

- pgvector `sparsevec` holds up to 1,000 non-zero elements, up to 16,000 dimensions for an HNSW index. The vocabulary of `bge-m3` is about 250,000 tokens, which is more than the index limit (not verified that HNSW refuses it; storage alone allows more). https://github.com/pgvector/pgvector
- `Xenova/bge-m3` for transformers.js shows only the dense output (CLS pooling). The sparse weights need the `sparse_linear` head: ReLU of a linear layer on each token state, max-pooled per token id. In JS you must apply that head yourself on `last_hidden_state`, or use an ONNX export with three outputs (`aapot/bge-m3-onnx`). Not verified in transformers.js. https://huggingface.co/Xenova/bge-m3, https://huggingface.co/aapot/bge-m3-onnx
- Gain: on MIRACL, M3 Dense 67.8 nDCG@10, Dense+Sparse 68.9 (+1.1). https://arxiv.org/abs/2402.03216
- **Out of scope.** `bge-m3` (568M parameters, 1024-d) replaces `multilingual-e5-small` (ADR-0006). The map puts model changes out of scope.

## 4. Hybrid in SQL with the grouping by Resource

Both stages keep the grouping of ADR-0002: each picks the best Chunk of each Resource with `DISTINCT ON`, then ranks the Resources. RRF joins the two ranked lists by `resource_id`:

```sql
WITH dense AS (
  SELECT resource_id, chunk_id, row_number() OVER (ORDER BY distance) AS r
  FROM (SELECT DISTINCT ON (c.resource_id) c.resource_id, c.id AS chunk_id,
               v.vector <=> $1 AS distance
        FROM chunks c JOIN vectors_384 v ON v.chunk_id = c.id
        ORDER BY c.resource_id, distance) best
  ORDER BY distance LIMIT 40
), lexical AS (
  SELECT resource_id, chunk_id, row_number() OVER (ORDER BY score DESC) AS r
  FROM (SELECT DISTINCT ON (c.resource_id) c.resource_id, c.id AS chunk_id,
               ts_rank_cd(c.tsv, q) AS score
        FROM chunks c, to_tsquery('simple_unaccent', $2) q
        WHERE c.tsv @@ q
        ORDER BY c.resource_id, score DESC) best
  ORDER BY score DESC LIMIT 40
)
SELECT resource_id,
       COALESCE(1.0 / (60 + d.r), 0) + COALESCE(1.0 / (60 + l.r), 0) AS rrf,
       d.chunk_id AS dense_chunk, l.chunk_id AS lexical_chunk
FROM dense d FULL OUTER JOIN lexical l USING (resource_id)
ORDER BY rrf DESC LIMIT 20;
```

(The filters of ready state and model are left out for space.) Open decision: a Resource can have two best Chunks, one per stage. The Reranker can score both and keep the higher, or score only one. The eval must decide.

Examples: pgvector RRF example https://github.com/pgvector/pgvector-python/blob/master/examples/hybrid_search/rrf.py; Supabase `hybrid_search` with `ts_rank_cd`, GIN and `websearch_to_tsquery` https://supabase.com/docs/guides/ai/hybrid-search; Jonathan Katz, RRF with `ts_rank_cd` and k = 50 https://jkatz05.com/post/postgres/hybrid-search-postgres-pgvector/; ParadeDB RRF with `pdb.score` (link above).

**Drizzle 0.45.** No `tsvector` column type: declare it with `customType`, a generated column with `.generatedAlwaysAs(sql\`...\`)`, and a GIN index with `index().using('gin', table.tsv)`. Write the query with `` sql`` `` (or `db.execute`), as the operators `@@`, `|||` and `<@>` have no helpers. Not verified in this repo.

## 5. Evidence of gain

- MIRACL Spanish: BM25 0.319, mDPR 0.478, hybrid BM25 + mDPR 0.641 nDCG@10. Hybrid is the strongest of the three, with a weak dense model. https://arxiv.org/abs/2210.09984
- Anthropic, contextual retrieval: BM25 + embeddings lowered the top-20 failure rate more than embeddings alone, and a reranker on top lowered it more. https://www.anthropic.com/news/contextual-retrieval
- A 2026 benchmark: hybrid then cross-encoder gives +17.2 points of MRR@3 over hybrid alone. https://arxiv.org/abs/2604.01733
- With a strong multilingual dense model (`bge-m3`), the sparse part adds only +1.1 (section 3). Expect a small gain on average and a large gain on exact terms, codes and names, where dense models fail. No study found for `multilingual-e5-small` + `tsvector` + a reranker in Spanish: the eval of the map must measure it, with Queries of exact technical terms.

## 6. What fits

1. **`tsvector` `simple` + `unaccent`, GIN, OR query, RRF in SQL.** Same image, no new licence, small migration (one generated column and one index). Weak ranking, but the Reranker reorders. Best first step.
2. **`pg_textsearch` on the same tokens.** True BM25, PostgreSQL licence. Costs: a new image (`timescaledb-ha` or a custom build on `pgvector/pgvector:pg18`), a young extension, no phrase query. Take it only if the eval shows that option 1 misses Resources.
3. **ParadeDB `pg_search`.** Best tokenizers (Snowball `spanish`, ASCII folding) and BM25, image with pgvector. Costs: AGPL, a large extension and a different image.

Not recommended on this map: two configurations or language detection (complexity for a gain that the dense stage already gives), VectorChord-bm25 (AGPL/ELv2, no Spanish stemmer), and `bge-m3` sparse (model change).
