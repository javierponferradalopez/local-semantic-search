# Vector store on a laptop — fact sheet (research ticket #2)

Date of research: 2026-09-12. All versions below were checked on that date.
This document reports facts. It does not make the choice.

Product constraints that frame the facts: fully local, Docker only, no cloud
account, Transformers.js embeddings, chunk text stored next to the vector,
metadata that can carry a citation (file, page, position), and a later agentic
chat over the same store.

---

## 1. MongoDB Atlas Vector Search, local

### 1.1 The `$vectorSearch` stage needs a second process — verified

`mongot` is a separate process from `mongod`. It is built on Apache Lucene. It
powers the `$search`, `$searchMeta` and `$vectorSearch` stages. It syncs index
data from `mongod` through change streams, keeps the search indexes on its own
storage, and answers search queries. Clients never connect to `mongot`. All
traffic goes through `mongod` over gRPC.
Source: https://www.mongodb.com/docs/search/self-managed/current/

Result: a plain `mongod` container (`mongodb/mongodb-community-server`) cannot
run `$vectorSearch`. You must also run `mongot`.

### 1.2 What changed — Community can now run mongot

MongoDB Search and MongoDB Vector Search are now available for self-managed
deployments, both Enterprise Advanced and Community Edition. For Community the
feature needs MongoDB 8.2 or later, and it costs nothing extra under the SSPL.
MongoDB published the `mongot` source under the SSPL.
Sources:
- https://www.mongodb.com/company/blog/product-release-announcements/mongodb-search-vector-search-now-run-anywhere
- https://www.mongodb.com/company/blog/product-release-announcements/supercharge-self-managed-apps-search-vector-search-capabilities
- https://www.mongodb.com/docs/vector-search/deployment/deployment-options/

Community Edition gets two install artifacts: a Linux tarball with the `mongot`
binary, and an official `mongot` container image. A two-container compose file
(`mongodb/mongodb-community-server:8.2` plus a `mongodb-community-search`
image) is therefore possible. The exact tag of the search image is not
confirmed from official docs; third-party examples name
`mongodb/mongodb-community-search:0.53.1` and `:1.70.1`. Treat the tag as
UNVERIFIED. Also note that `mongod` must run as a replica set, even with one
node, because search needs change streams.
Source (third party, unverified): https://github.com/marmelab/mongot

### 1.3 The `mongodb/mongodb-atlas-local` image

The image is a full deployment of both `mongod` and `mongot` as a single-node
replica set. `$vectorSearch` works with it on a laptop. No cloud account is
needed.
Source: https://hub.docker.com/r/mongodb/mongodb-atlas-local

Facts about the image:

- Size: about 612–620 MB compressed per tag, for `linux/amd64`. The `arm64`
  variants are 6–8 MB smaller. Tags seen on 2026-09-12: `7.0.37`, `7.0.41`,
  `8.0.28`, `8.3.3`, `8.3.4`, all pushed within the last day, plus the moving
  tags `latest`, `preview`, `8.0`, `7.0`.
  Source: https://hub.docker.com/r/mongodb/mongodb-atlas-local/tags
- Environment variables: `MONGODB_INITDB_ROOT_USERNAME`,
  `MONGODB_INITDB_ROOT_PASSWORD`, `MONGODB_INITDB_DATABASE`,
  `MONGODB_LOAD_SAMPLE_DATA`, `MONGOT_LOG_FILE`, `RUNNER_LOG_FILE`,
  `DO_NOT_TRACK`, `VOYAGE_API_KEY` (preview tag only, for auto-embedding).
- The image runs its own healthcheck every 30 s. It checks that `mongod` and
  `mongot` are both healthy. Compose can wait on it with
  `condition: service_healthy`.
- Init scripts go in `/docker-entrypoint-initdb.d`. During init the image sets
  `$CONNECTION_STRING`.
- Do not override the image ENTRYPOINT with a `command:` key in compose.
  Source: https://www.mongodb.com/docs/atlas/cli/current/atlas-cli-deploy-docker/
- Requirements: Docker Desktop 4.31+ or Docker Engine 27.0+, 2 CPU cores and
  2 GB free RAM, port 27017 free.

**Trap: you must persist `/data/mongot`.** `mongot` keeps its indexes in
`/data/mongot`. If you mount only `/data/db` and `/data/configdb`, the vector
index disappears after `docker compose down && up`. This was reported against
`mongodb/mongodb-atlas-local:7.0.14` and the fix is the extra volume.
Source: https://www.mongodb.com/community/forums/t/mongodb-atlas-local-vector-search-index-goes-missing/299534

The official compose example now includes all three volumes:

```yaml
services:
  mongodb:
    image: mongodb/mongodb-atlas-local
    hostname: mongodb
    environment:
      - MONGODB_INITDB_ROOT_USERNAME=user
      - MONGODB_INITDB_ROOT_PASSWORD=pass
      - MONGOT_LOG_FILE=/dev/stderr
      - RUNNER_LOG_FILE=/dev/stderr
    ports:
      - 27017:27017
    volumes:
      - ./init:/docker-entrypoint-initdb.d
      - db:/data/db
      - configdb:/data/configdb
      - mongot:/data/mongot
    healthcheck:
      test: [ "CMD", "mongosh", "--eval", "db.adminCommand('ping')" ]
      interval: 10s
      timeout: 5s
      retries: 5
volumes:
  db:
  configdb:
  mongot:
```

Connect with `mongodb://localhost:27017/?directConnection=true`.
Source: https://www.mongodb.com/docs/atlas/cli/current/atlas-cli-docker-compose/

### 1.4 `atlas deployments setup --type local`

That command is deprecated. The current command is `atlas local setup`. It
needs the Atlas CLI **and** Docker (Desktop 4.31+, Engine 27.0+, or Podman 5.0+
on RHEL). It creates a single-node replica set in Docker containers. The page
lists MongoDB 7.0 (default) and 6.0 as the deployment versions, so this route
appears to lag the image tags. Minimum 2 cores and 2 GB RAM.
Source: https://www.mongodb.com/docs/atlas/cli/current/atlas-cli-deploy-local/

For a repo that other people clone, the CLI adds a second tool to install. The
plain image plus `docker compose up` does not.

### 1.5 Index limits and behaviour

- Index creation is **asynchronous**. `createSearchIndex()` starts the build.
  There can be a delay between the response and the index being usable. You
  poll `$listSearchIndexes` (Node helper: `collection.listSearchIndexes()`) and
  read `status` and the `queryable` boolean.
  Sources:
  https://www.mongodb.com/docs/manual/reference/method/db.collection.createSearchIndex
  and https://www.mongodb.com/docs/manual/reference/operator/aggregation/listSearchIndexes/
- How long the index takes to become queryable on a laptop is **not documented**
  by MongoDB. Do not guess. Measure it in the spike.
- Index count: the documented caps are per Atlas cluster tier — free (M0) 3
  indexes, Flex 10, dedicated a hard limit of 2,500. For a local deployment
  MongoDB only says it is limited by the CPU, memory and storage of the local
  machine. No separate local index cap is documented.
  Source: https://www.mongodb.com/docs/vector-search/indexes/vector-search-type/
- Dimensions: `numDimensions` runs from 1 to **8192**.
- Similarity: `euclidean`, `cosine`, `dotProduct`.
- `indexingMethod`: `hnsw` (default) or `flat` (exhaustive, 100 % recall).
  HNSW options: `maxEdges` 16–64 (default 16), `numEdgeCandidates` 100–3200
  (default 100).
- Quantization: `none` (default), `scalar` (~1/3.75 of RAM), `binary` (~1/24 of
  RAM, dimensions must be a multiple of 8).
- Filter fields: declare `{"type": "filter", "path": "..."}`. Allowed BSON
  types are boolean, date, objectId, numeric, string and UUID, and arrays of
  those. This covers a citation payload (`fileId`, `page`, `mimeType`, dates).
- Pre-filtering does not change `vectorSearchScore`.

### 1.6 Query shape

`$vectorSearch` must be the **first stage** of the pipeline. Required fields:
`index`, `path`, `queryVector`, `limit`. ANN needs `numCandidates` (docs advise
at least 20× `limit`). `exact: true` switches to exhaustive ENN. `filter` takes
MQL operators. The score comes from `{ $meta: "vectorSearchScore" }`, in the
range 0–1. The stage cannot be used inside a view definition, a `$lookup`
sub-pipeline, or a `$facet`.
Source: https://www.mongodb.com/docs/vector-search/query/aggregation-stages/vector-search-stage/

### 1.7 Node/TypeScript client

`mongodb` 7.6.0, published 2026-09-12. TypeScript types ship in the package.
The driver has `createSearchIndex()`, `createSearchIndexes()`,
`listSearchIndexes()`, `updateSearchIndex()` and `dropSearchIndex()`. Creating
a vector search index through the driver needs server 6.0.11+ / 7.0.2+.

```ts
await collection.createSearchIndex({
  name: "chunks_vector",
  type: "vectorSearch",
  definition: {
    fields: [
      { type: "vector", path: "embedding", numDimensions: 384, similarity: "cosine" },
      { type: "filter", path: "fileId" }
    ]
  }
});
```

Source: https://www.mongodb.com/docs/drivers/node/current/indexes/

### 1.8 Two vector spaces

Two ways. Put two vector fields in the same collection — for example
`textEmbedding` (384 dims) and `imageEmbedding` (512 dims) — and index both.
One index definition may carry several `vector` fields; a query targets one
`path` at a time. Or use two collections. There is no dimension mismatch
problem, because the dimension is a property of the indexed field, not of the
collection. Limit: the same embedding field cannot be indexed twice inside one
definition, and embedding fields inside arrays of documents cannot be indexed.

### 1.9 Memory and disk at rest

`mongot` is a JVM process. Its default heap is up to 25 % of system memory
(cap 32 GB). MongoDB advises 50 % of system memory, up to about 30 GB, with
`-Xms` equal to `-Xmx`. Heap use scales with the number of indexed fields.
Lucene also wants filesystem cache. For disk, MongoDB advises about double the
index size, because a no-downtime rebuild needs 125 % of the old index size
free. `mongot` goes read-only at 90 % storage use.
Source: https://www.mongodb.com/docs/search/self-managed/current/resource-planning-sizing/hardware/

So at rest on a laptop you pay for two processes: WiredTiger cache plus a JVM
heap. The documented floor for the local deployment is 2 GB RAM and 2 cores.
No measured idle figure is published. UNVERIFIED until measured.

---

## 2. Postgres with pgvector

### 2.1 Image

`pgvector/pgvector`, built on the official `postgres` image. Tags name both the
extension and the server, for example `0.8.6-pg18-trixie` / `pg18-trixie`.
Postgres 13 to 18 are covered, on `trixie` and `bookworm` bases. Compressed
size is about 150–156 MB (pg13 is 186 MB). Last push: 30 days before
2026-09-12, by `ankane`.
Source: https://hub.docker.com/r/pgvector/pgvector/tags

pgvector version: **0.8.6**, released 2026-07-29. 0.8.7 is unreleased. The
extension supports Postgres 13 and later.
Sources: https://github.com/pgvector/pgvector and
https://github.com/pgvector/pgvector/blob/master/CHANGELOG.md

### 2.2 Types and dimension limits

| Type | Max dimensions | Storage |
|---|---|---|
| `vector` | 16,000 | 4 × dims + 8 bytes |
| `halfvec` | 16,000 | 2 × dims + 8 bytes |
| `bit` | 64,000 | dims/8 + 8 bytes |
| `sparsevec` | 16,000 non-zero elements | 8 × elements + 16 bytes |

Index limits are lower than column limits, because an index tuple must fit in
one 8 KB Postgres page:

- HNSW: `vector` 2,000 dims, `halfvec` 4,000 dims, `bit` 64,000 dims,
  `sparsevec` 1,000 non-zero elements.
- IVFFlat: `vector` 2,000 dims, `halfvec` 4,000 dims, `bit` 64,000 dims.

Source: https://github.com/pgvector/pgvector and
https://github.com/pgvector/pgvector/issues/461

For this project the limit does not bite: typical Transformers.js text models
give 384 or 768 dims, and CLIP image models give 512 dims.

### 2.3 Index types, exact and approximate search

Without an index, a query does **exact** nearest neighbour search with perfect
recall. With an index the search becomes **approximate** and recall drops.

- **HNSW**: graph index. Build parameters `m` (default 16) and
  `ef_construction` (default 64). Query parameter `hnsw.ef_search` (default 40).
  It can be built on an empty table.
- **IVFFlat**: list index. Parameter `lists`, advised as `rows/1000` up to 1 M
  rows, then `sqrt(rows)`. It must be built after the table holds data.

Build speed depends on `maintenance_work_mem` and
`max_parallel_maintenance_workers` (default 2). In Docker, set `shm_size` at
least as large as `maintenance_work_mem` for parallel HNSW builds.

### 2.4 Distance operators

`<->` L2, `<#>` negative inner product, `<=>` cosine, `<+>` L1,
`<~>` Hamming (bit), `<%>` Jaccard (bit). Each index is created for one
operator class, for example `vector_cosine_ops`.

### 2.5 Metadata filtering with vector search

Metadata is ordinary SQL columns, so filtering is a plain `WHERE` clause and
joins are free. Three ways to make it fast:

1. **Iterative index scans**, added in **0.8.0**. Set
   `hnsw.iterative_scan = strict_order | relaxed_order` (or
   `ivfflat.iterative_scan`). The index then returns candidates batch by batch
   until enough rows survive the filter, bounded by `hnsw.max_scan_tuples` or
   `ivfflat.max_probes`. Before 0.8.0 the filter was applied after the index
   scan, which often gave fewer rows than `LIMIT`.
2. **Partial indexes** — `CREATE INDEX ... WHERE tenant = 'x'`. Good for a few
   distinct values. It does not scale to high-cardinality columns.
3. Plain B-tree indexes on the metadata columns for the exact-scan path.

Sources: https://www.postgresql.org/about/news/pgvector-080-released-2952 and
https://github.com/pgvector/pgvector

### 2.6 Two vector spaces

Two columns with different dimensions in one table, or two tables. The
dimension is fixed per column:

```sql
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE chunk (
  id          bigserial PRIMARY KEY,
  document_id uuid NOT NULL,
  page        int,
  char_start  int,
  char_end    int,
  text        text NOT NULL,
  embedding   vector(384)
);
CREATE INDEX ON chunk USING hnsw (embedding vector_cosine_ops);

CREATE TABLE image_region (
  id          bigserial PRIMARY KEY,
  document_id uuid NOT NULL,
  page        int,
  bbox        jsonb,
  embedding   vector(512)
);
CREATE INDEX ON image_region USING hnsw (embedding vector_cosine_ops);
```

Two tables are the cleaner shape here, because text chunks and image regions
carry different metadata. A `UNION ALL` over two searches merges the results.

### 2.7 Node/TypeScript client

- `pg` (node-postgres) 8.23.0, published 2026-08-08. Types come from the
  separate `@types/pg` package. Alternatives: `postgres` (postgres.js) 3.4.9
  with built-in types, or `drizzle-orm` 0.45.2.
- `pgvector` npm 0.3.0, published 2026-05-31. It supports node-postgres,
  Knex.js, Objection.js, Kysely, Sequelize, pg-promise, Prisma, Postgres.js,
  Slonik, TypeORM, MikroORM, Drizzle ORM, deno-postgres and Bun SQL. The repo
  states TypeScript support.

```ts
import pgvector from 'pgvector/pg';
await client.query('CREATE EXTENSION IF NOT EXISTS vector');
await pgvector.registerTypes(client);
await client.query('INSERT INTO chunk (text, embedding) VALUES ($1, $2)',
  [text, pgvector.toSql(embedding)]);
const res = await client.query(
  'SELECT id, text FROM chunk WHERE document_id = $2 ORDER BY embedding <=> $1 LIMIT 5',
  [pgvector.toSql(queryEmbedding), documentId]);
```

Source: https://github.com/pgvector/pgvector-node

Note for a hexagonal port: the store adapter writes SQL. There is no
vector-store API to hide; the port hides SQL instead.

### 2.8 Compose story

```yaml
services:
  postgres:
    image: pgvector/pgvector:0.8.6-pg18-trixie
    environment:
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: semantic_search
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
      - ./db/init:/docker-entrypoint-initdb.d
    shm_size: 1gb
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 10
volumes:
  pgdata:
```

`CREATE EXTENSION vector;` and the schema go in `./db/init/001-schema.sql`. The
official `postgres` entrypoint runs those files on first start.

### 2.9 Memory and disk at rest

Default `shared_buffers` is 128 MB. Docker gives `/dev/shm` only 64 MB by
default, which is why `shm_size` is set above. An idle Postgres container is
small — public reports put a trimmed Postgres under 150 MB resident — but no
official idle figure exists. Treat the exact number as UNVERIFIED.
Sources: https://www.postgresql.org/docs/current/runtime-config-resource.html
and https://www.instaclustr.com/blog/postgresql-docker-and-shared-memory/

HNSW index size grows with `m` and dimension count. pgvector gives no single
formula; measure it.

---

## 3. Qdrant

### 3.1 Image

`qdrant/qdrant`. Latest release tag on 2026-09-12: **v1.19.1**, pushed 9 days
earlier. Compressed size about **70 MB** for both `linux/amd64` and
`linux/arm64`. There are `-unprivileged` and GPU variants.
Source: https://hub.docker.com/r/qdrant/qdrant/tags

```bash
docker run -p 6333:6333 -p 6334:6334 \
  -v "$(pwd)/qdrant_storage:/qdrant/storage:z" qdrant/qdrant
```

REST on 6333, gRPC on 6334, data in `/qdrant/storage`. The dashboard is at
`http://localhost:6333/dashboard` and ships inside the image, with no extra
container.
Source: https://qdrant.tech/documentation/quickstart/

### 3.2 Collection and payload model

A collection is a named set of points. A point is an id, one or more vectors,
and a JSON payload. You set vector `size` and `distance` (`Cosine`, `Dot`,
`Euclid`, `Manhattan`) when you create the collection. The payload is where
chunk text and the citation metadata live, next to the vector.

Vector datatypes: `float32` (default), `float16`, `uint8`, and `turbo4` (4 bits
per dimension, since v1.19.0).
Sources: https://qdrant.tech/documentation/concepts/collections/ and
https://qdrant.tech/documentation/concepts/vectors/

### 3.3 Named vectors

Named vectors exist since **v0.10.0**. One point can hold several vectors, each
with its own **size** and its own distance metric. The docs give exactly the
multimodal example: an `image` vector and a `text` vector in one collection.
You choose the space at query time with `"using": "text"`.

Sparse vectors exist since v1.7.0. They must be named, cannot reuse a dense
vector name, and always use Dot distance.

Can a point carry only some of the named vectors? The official docs do not say
it in one sentence, but two API features prove it: the delete-vectors endpoint
removes named vectors from points and states that "all other unspecified
vectors will stay intact", and the filter language has a `has_vector`
condition that selects points which hold a given named vector. Some third-party
tutorials claim that every point must carry every named vector; that claim
contradicts the API reference and should be treated as wrong until a test says
otherwise.
Sources: https://api.qdrant.tech/api-reference/points/delete-vectors and
https://qdrant.tech/documentation/concepts/filtering/

### 3.4 Filtering

A filter has `must` (AND), `should` (OR) and `must_not` clauses, and they nest.
Conditions: match, match-any, match-except, full-text / phrase / prefix match,
numeric range, datetime range (RFC 3339), geo bounding box / radius / polygon,
`values_count`, `is_empty`, `has_id`, `has_vector`, and `nested` for arrays of
objects. Filters act as a pre-filter that narrows the candidate set before the
similarity work. Create payload indexes on the fields you filter on.
Source: https://qdrant.tech/documentation/concepts/filtering/

### 3.5 Node/TypeScript client

`@qdrant/js-client-rest` 1.19.0, published 2026-08-04 — the client version
tracks the engine version. Types are generated from Qdrant's OpenAPI schema
(`codegen:openapi-typescript` against the remote `openapi.json`). Node 18+,
ESM and CJS, and it also runs on Deno, browsers and Cloudflare Workers. A gRPC
client (`@qdrant/js-client-grpc`) and an umbrella package (`@qdrant/qdrant-js`)
also exist.

```ts
import { QdrantClient } from '@qdrant/js-client-rest';
const client = new QdrantClient({ url: 'http://localhost:6333' });

await client.createCollection('content', {
  vectors: {
    text:  { size: 384, distance: 'Cosine' },
    image: { size: 512, distance: 'Cosine' }
  }
});

await client.query('content', {
  query: queryEmbedding,
  using: 'text',
  filter: { must: [{ key: 'documentId', match: { value: docId } }] },
  with_payload: true,
  limit: 5
});
```

Sources: https://github.com/qdrant/qdrant-js and
https://github.com/qdrant/qdrant-js/tree/master/packages/js-client-rest

### 3.6 Compose story

```yaml
services:
  qdrant:
    image: qdrant/qdrant:v1.19.1
    ports:
      - "6333:6333"
      - "6334:6334"
    volumes:
      - qdrant_storage:/qdrant/storage
volumes:
  qdrant_storage:
```

No credentials are needed for local use. The dashboard comes for free.
Windows users should use a named volume, not a bind mount.

### 3.7 Memory and disk at rest

Qdrant stores vectors in memory-mapped files on disk. Two memory tiers exist:
`cached` (default for vectors — Qdrant pre-loads the file into the disk cache
at startup) and `cold` (no pre-load, slower first request). Payload storage
defaults to `cold`. `memmap_threshold` controls when a segment becomes
memory-mapped; the docs suggest matching `indexing_threshold` (default 10000).

RAM estimate when you keep all vectors in memory:
`memory = vectors × dimensions × 4 bytes × 1.5`. The 50 % covers indexes, point
versions and temporary segments. Worked example from the docs: 1 M vectors of
1024 dims ≈ 5.72 GB.

For this project the number is small. 50,000 chunks × 384 dims × 4 bytes × 1.5
≈ 115 MB.
Sources: https://qdrant.tech/documentation/capacity-planning/ and
https://qdrant.tech/documentation/manage-data/storage/

---

## 4. Cross-cutting comparison

### 4.1 The four shared questions

| Question | MongoDB Atlas Local | Postgres + pgvector | Qdrant |
|---|---|---|---|
| **Two vector spaces, different dims** | Yes. Two vector fields in one collection (`textEmbedding` 384, `imageEmbedding` 512), each with its own index entry, or two collections. Dimension belongs to the indexed field. A query targets one `path`. | Yes. Two columns or two tables. Dimension is fixed in the column type: `vector(384)`, `vector(512)`. Each column gets its own index. `UNION ALL` merges results. | Yes, and it is a first-class feature. Named vectors in one collection, each with its own `size` and `distance`. Query picks the space with `using`. Points may hold a subset (proved by `delete_vectors` and `has_vector`). |
| **Node/TS client** | `mongodb` 7.6.0 (2026-09-12). Types built in. First-party, heavily maintained. Search index methods included. Index creation is async, so the adapter must poll `listSearchIndexes()`. | `pg` 8.23.0 + `@types/pg`, or `postgres` 3.4.9. Plus `pgvector` 0.3.0 (2026-05-31) for the type codec. The port hides SQL strings, not an SDK. | `@qdrant/js-client-rest` 1.19.0 (2026-08-04). Types generated from OpenAPI, versions aligned with the engine. Node 18+. Smallest API surface of the three. |
| **`docker compose up` story** | One service, but a 612–620 MB image, root credentials, three named volumes — and `/data/mongot` **must** be one of them or indexes vanish on restart. Built-in healthcheck (every 30 s) makes `depends_on: service_healthy` easy. Do not override the entrypoint. | One service, 150–156 MB image, one volume plus an init-SQL folder that creates the extension and the schema on first boot. Needs `shm_size` raised for parallel HNSW builds. `pg_isready` healthcheck. | One service, 70 MB image, one volume, no credentials, no init step. Collections are created by the app at boot. Dashboard included at `/dashboard`. |
| **Disk and memory at rest** | Image 612–620 MB compressed. Documented floor 2 GB RAM and 2 cores. Two processes: `mongod` (WiredTiger cache) and `mongot` (JVM heap, default up to 25 % of system RAM). Disk: plan ~2× the index size for rebuilds. No published idle figure. | Image ~155 MB. `shared_buffers` default 128 MB. One process tree. No official idle figure; public reports put a trimmed instance under 150 MB resident. | Image ~70 MB. Vectors are mmap'd on disk; `cached` tier pre-loads at startup. RAM ≈ vectors × dims × 4 B × 1.5 if kept in memory; ≈115 MB for 50 k × 384. No published idle figure. |

### 4.2 Other differences that matter for this product

| Point | MongoDB | pgvector | Qdrant |
|---|---|---|---|
| Index creation | Asynchronous. Poll for `queryable`. Build time on a laptop not documented. | Synchronous `CREATE INDEX`. Blocks (or `CONCURRENTLY`). | Synchronous collection creation; HNSW build happens in the background above `indexing_threshold`. |
| Max indexed dimensions | 8192 | 2000 (`vector`), 4000 (`halfvec`) | No documented cap found |
| Exact search option | `exact: true` (ENN), or `indexingMethod: "flat"` | Query without an index | `exact: true` on search |
| Distance metrics | euclidean, cosine, dotProduct | L2, inner product, cosine, L1, Hamming, Jaccard | Cosine, Dot, Euclid, Manhattan |
| Filtering model | Pre-filter with MQL, filter fields must be declared in the index | SQL `WHERE`, plus iterative index scans (0.8.0+) and partial indexes | Pre-filter with payload conditions, payload indexes advised |
| Chunk text next to the vector | Same document | Same row | Point payload |
| Built-in UI | No (Compass is a separate app) | No (psql / pgAdmin separate) | Yes, `/dashboard` |
| Hybrid / keyword search later | `$search` from the same `mongot`, `$rankFusion` on 8.2+ | Postgres full-text search, `tsvector`, same query | Sparse vectors since 1.7.0 |
| Extra load-bearing process | `mongot` (JVM, Lucene) | none | none |
| Licence | SSPL (server and `mongot`) | PostgreSQL licence (core), pgvector MIT-style | Apache 2.0 |

### 4.3 Open points — not verified

- Real idle RSS of each container on a laptop. Nobody publishes this. Measure
  it with `docker stats` in the spike.
- Time for a MongoDB vector index to become `queryable` on a local deployment.
  Not documented.
- Whether the documented Atlas index-count caps (3 / 10 / 2500) apply at all to
  the `mongodb-atlas-local` image. MongoDB only says local is limited by local
  resources.
- Exact tag of the standalone Community `mongot` container image
  (`mongodb/mongodb-community-search:?`). Only third-party examples found.
- Whether a Qdrant point can be upserted with only one of two named vectors.
  The API reference implies yes; third-party tutorials claim no. Test it.

---

## 5. Sources

MongoDB
- https://www.mongodb.com/docs/search/self-managed/current/
- https://www.mongodb.com/docs/vector-search/deployment/deployment-options/
- https://www.mongodb.com/docs/vector-search/deployment/compatibility-limitations/
- https://www.mongodb.com/docs/vector-search/indexes/vector-search-type/
- https://www.mongodb.com/docs/vector-search/query/aggregation-stages/vector-search-stage/
- https://www.mongodb.com/docs/atlas/cli/current/atlas-cli-deploy-docker/
- https://www.mongodb.com/docs/atlas/cli/current/atlas-cli-docker-compose/
- https://www.mongodb.com/docs/atlas/cli/current/atlas-cli-deploy-local/
- https://www.mongodb.com/docs/drivers/node/current/indexes/
- https://www.mongodb.com/docs/manual/reference/method/db.collection.createSearchIndex
- https://www.mongodb.com/docs/manual/reference/operator/aggregation/listSearchIndexes/
- https://www.mongodb.com/docs/search/self-managed/current/resource-planning-sizing/hardware/
- https://hub.docker.com/r/mongodb/mongodb-atlas-local
- https://hub.docker.com/r/mongodb/mongodb-atlas-local/tags
- https://www.mongodb.com/company/blog/product-release-announcements/mongodb-search-vector-search-now-run-anywhere
- https://www.mongodb.com/company/blog/product-release-announcements/supercharge-self-managed-apps-search-vector-search-capabilities
- https://www.mongodb.com/community/forums/t/mongodb-atlas-local-vector-search-index-goes-missing/299534
- https://github.com/marmelab/mongot (third party, unverified)

pgvector / Postgres
- https://github.com/pgvector/pgvector
- https://github.com/pgvector/pgvector/blob/master/CHANGELOG.md
- https://github.com/pgvector/pgvector/issues/461
- https://github.com/pgvector/pgvector-node
- https://hub.docker.com/r/pgvector/pgvector/tags
- https://www.postgresql.org/about/news/pgvector-080-released-2952
- https://www.postgresql.org/docs/current/runtime-config-resource.html
- https://www.instaclustr.com/blog/postgresql-docker-and-shared-memory/

Qdrant
- https://qdrant.tech/documentation/quickstart/
- https://qdrant.tech/documentation/concepts/collections/
- https://qdrant.tech/documentation/concepts/vectors/
- https://qdrant.tech/documentation/concepts/filtering/
- https://qdrant.tech/documentation/manage-data/storage/
- https://qdrant.tech/documentation/capacity-planning/
- https://api.qdrant.tech/api-reference/points/delete-vectors
- https://github.com/qdrant/qdrant-js
- https://hub.docker.com/r/qdrant/qdrant/tags

npm versions were read with `npm view <pkg> version time.modified` on
2026-09-12.
