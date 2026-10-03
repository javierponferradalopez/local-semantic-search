# Local semantic search

A local product that finds your own content by meaning. You create Resources
from your files, the system stores their vectors, and you find the content when
you type text.

The words this product uses are in [`CONTEXT.md`](CONTEXT.md). The decisions are in
[`docs/adr/`](docs/adr/). The words of the evals, such as F0.5, `holdout` and the
verdict, are in [`docs/evals-glossary.md`](docs/evals-glossary.md), for a
person who is new to search and RAG.

## Prerequisites

- **Node 24.** The repository holds an `.nvmrc`, so `nvm use` selects it.
- **Docker.** It runs the store, and nothing else. The application runs natively.
- **pnpm.** The version is pinned in `package.json`. Run `corepack enable pnpm` one
  time, and Node gets that version for you.

## Start the application

Three commands on a clean clone:

```sh
pnpm install
pnpm run bootstrap
pnpm dev
```

- `pnpm install` installs the three packages of the workspace.
- `pnpm run bootstrap` copies `backend/.env.example` to `backend/.env`, starts
  Postgres, waits until it is healthy, applies the migrations, and gets the weights
  of the Text model, the Vision model and the Reranker into the model store,
  `backend/data/models/`.
- `pnpm dev` starts the backend on `http://localhost:3000` and the frontend on
  `http://localhost:5173`.

## The model store

`backend/data/models/` holds the weights of three models:

- The Text model, `intfloat/multilingual-e5-small`, in `fp32`, about 0.5 GB.
- The Vision model, `onnx-community/siglip2-base-patch16-224-ONNX`, in `fp32`,
  about 1.5 GB: its text tower and its vision tower.
- The Reranker, `onnx-community/gte-multilingual-reranker-base`, in `q8`, about
  0.35 GB.

`pnpm run models:fetch` gets them, and `bootstrap` runs it. It is the only command
that uses the network: the application never downloads.

The backend loads the three models before it listens. This costs about 3 s at
every start, `tsx watch` included, and about 4 GB stays resident. If the model
store does not hold a model, the backend does not start, and it tells you to run
`pnpm run bootstrap`. If a file of a model is damaged, the backend shows the error
of the library: delete the folder of the model and run `pnpm run models:fetch` again.

## Start clean

Two commands, because two owners hold the data:

```sh
docker compose --file backend/docker-compose.yml down -v
rm -rf backend/data/resources/*
```

The first command removes the named volume that holds Postgres. The second command
removes the stored Files. If you run only the first command, the screen shows an
empty list and the copies stay on your disk.

## The layout

```
contract/   TypeScript source that both halves read. No dependency, no build step.
frontend/   React and Vite. Path alias `@/`.
backend/    Express, Drizzle and Postgres. Relative imports.
  src/api/  The HTTP edge. No business logic.
  src/core/ The business, split by capability.
  data/     Git-ignored in full. The stored Files and the model weights.
```

## The scripts

| Command | What it does |
|---|---|
| `pnpm run bootstrap` | Starts the store, applies the migrations and gets the models |
| `pnpm run models:fetch` | Gets the weights of the models into the model store |
| `pnpm dev` | Starts the backend and the frontend together |
| `pnpm run lint` | Runs Biome over the whole tree |
| `pnpm run lint:ci` | Runs Biome the way CI runs it, and writes nothing |
| `pnpm run format` | Runs Biome and writes the fixes |
| `pnpm run typecheck` | Runs `tsc --noEmit` in each package |
| `pnpm run test:unit` | Runs the unit tests |
| `pnpm run test:integration` | Runs the integration tests. Needs Docker |
| `pnpm run test:e2e` | Runs the end-to-end tests. Needs Docker |
| `pnpm run test:eval` | Runs the evals. Needs Docker and the models in the model store |

## The tests

Vitest runs in four modes, and each mode has one script. `unit` covers the domain
and the use cases, with the ports mocked. `integration` covers the adapters, which
are the parts that talk to the store and to the disk. `e2e` covers the endpoints,
over the application booted in process. `eval` measures what a `Search` gives.

`test:integration`, `test:e2e` and `test:eval` share one test infrastructure: one
container with the Postgres image of `backend/docker-compose.yml`, the migrations, and
a temp directory for the Files. Each run starts its own container, and each suite
wipes the data before it starts. No test touches
`backend/data/`.

A port is mocked with the helper in `backend/test/utils/mock.ts`, and never with
`vi.mock`. Everything else is real.

CI runs Biome, the type check and the unit tests, and nothing else. A test never
loads a model: what a model does is measured by an eval, which
[ADR-0016](docs/adr/0016-a-model-is-judged-by-an-eval-never-by-a-test.md) describes.

An eval is a `*.eval.ts` file in `backend/test/eval/`, in the mirror of the code
that it measures. It calls `runEval` of `backend/test/lib/runEval.ts` with `data`,
`task` and `scorers`, the shape of Evalite. An eval gives a score, not a pass or a
fail: the runner prints the score of each case beside the score of the previous run,
and writes the report into `backend/evals/reports/`. Git versions the reports, so a
change of model or of cutter carries its evidence in the same commit. CI never runs
the evals, because CI never downloads a model.

The eval of `Search` starts a Postgres container, so it needs Docker. It ingests the
corpus of `backend/evals/` through the application, which takes minutes, and runs the
`Search` that ships. Each report gives a verdict against the previous report: "win",
"loss" or "tie", for the `tuning` and the `holdout` subjects. The verdict of
`holdout` is the one that counts.
[ADR-0041](docs/adr/0041-the-eval-measures-a-search-on-postgres.md) describes it.

## The house style

`biome.json` holds the style of the reference: single quotes, `{foo}` with no inner
space, no trailing comma, 90 columns, two spaces, semicolons, type-only imports, no
`enum`, no barrel, explicit accessibility and an explicit return type. One command
applies it, and one command checks it.

Four rules of the reference stay a convention, because Biome cannot see them:

- A folder is kebab-case. Biome reads the name of a file, never the name of a folder.
- A PascalCase file carries the name of the one thing it exports: a class, a registrar
  or a constant. Biome reads the case of the name, never the name itself.
- A blank line comes before a `return` and around an `if`. The formatter has no option
  for it.
- A field that is never written is `readonly`, a promise is never left floating, and a
  type assertion that changes nothing is removed. All three need the types, which Biome
  does not read.
- A use case, a controller and an event take the verb the glossary uses. A Resource is
  created, so the name is `Create`, never `Add`. A read model gives what it holds, so
  the name is `Get`, never `List`.
