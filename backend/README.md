# backend

The HTTP API of the product. It creates and deletes the Resources, runs their
Ingest, runs each Search, and serves the stored Files. It holds the three models and
runs them locally. The frontend and the MCP server are its two clients.

It uses Express, Drizzle and Postgres with pgvector. Postgres is the single store of
the Resources, the Chunks, the Pictures and their Vectors.

## The HTTP API

| Route | What it does |
|---|---|
| `POST /resources/texts` | Creates a Text Resource from a File |
| `POST /resources/images` | Creates an Image Resource from a File |
| `GET /resources` | Gives all the Resources with their Ingest state |
| `DELETE /resources/texts/:id`, `DELETE /resources/images/:id` | Deletes a Resource and its File |
| `POST /resources/texts/:id/retry`, `POST /resources/images/:id/retry` | Ingests a `Failed` Resource again |
| `GET /search` | Gives the Results of a Query, in a text group and an image group |
| `GET /resources/texts/:id/matches` | Gives more Matches of one Text Resource for a Query |
| `GET /files/...` | Serves the stored File of a Resource |

Each request carries a Session in two headers, `Session-Id` and `Session-Origin`. A
request without them gets `401`. Only `/files` takes no Session, because an `<img>`
cannot send a header. The types of each request and each response are in
[`contract/`](../contract/README.md).

The Ingest runs after the response. A new Resource is `Ingesting` until its Ingest
ends, and the client asks `GET /resources` again to see `Ready` or `Failed`.

## Configuration

The backend reads `backend/.env`. `pnpm run bootstrap` copies `.env.example` to
`.env`, with the values of the local setup.

| Variable | What it holds |
|---|---|
| `DATABASE_URL` | The address of Postgres. The example points to the container of `docker-compose.yml`. |
| `PORT` | The port of the API. The frontend and the MCP server expect `3001`. |
| `FILES_DIRECTORY` | The folder of the stored Files, relative to `backend/`. The example is `data`. |
| `LANGFUSE_PUBLIC_KEY`, `LANGFUSE_SECRET_KEY`, `LANGFUSE_BASE_URL` | Optional. See below. |

If a required variable is missing, the backend does not start, and it names the
variable.

### Langfuse

[Langfuse](https://langfuse.com) is an observability tool for model calls. When the
three `LANGFUSE_*` variables are set, the backend sends each Model call to Langfuse:
its Usage, its Cost and the Session that caused it. Each Search and each Ingest is a
trace in its Session. The Cost uses the reference price of a hosted model of the same
kind, because the local models have no bill.

Set the three variables or none of them. With none of them, the backend sends
nothing. With only one or two, the backend does not start. If Langfuse does not
answer, the work continues: a failure to send never breaks a Search or an Ingest.

## Installation

From the root of the repository:

```sh
pnpm install
pnpm run bootstrap
```

The `bootstrap` of the backend does four things:

1. It copies `.env.example` to `.env`, if `.env` does not exist.
2. It starts Postgres with `docker compose` and waits until it is healthy.
3. It applies the migrations of `drizzle/`.
4. It gets the weights of the models into the model store.

### The model store

`backend/data/models/` holds the weights of three models:

- The Text model, `intfloat/multilingual-e5-small`, in `fp32`, about 0.5 GB.
- The Vision model, `onnx-community/siglip2-base-patch16-224-ONNX`, in `fp32`,
  about 1.5 GB: its text tower and its vision tower.
- The Reranker, `onnx-community/gte-multilingual-reranker-base`, in `q8`, about
  0.35 GB.

`pnpm run models:fetch` gets them, and `bootstrap` runs it. It is the only command
that uses the network: the backend never downloads.

## Start

From the root, `pnpm dev` starts the backend and the frontend together. To start only
the backend:

```sh
pnpm --filter backend dev
```

It runs with `tsx watch`, so a change in the code restarts it. It listens on
`http://localhost:3001`.

The backend loads the three models before it listens. This costs about 3 s at every
start, a restart of `tsx watch` included, and about 4 GB stays resident. If the model
store does not hold a model, the backend does not start, and it tells you to run
`pnpm run bootstrap`. If a file of a model is damaged, the backend shows the error of
the library: delete the folder of the model and run `pnpm run models:fetch` again.

### Change the schema

After you change a Drizzle schema, generate the migration and apply it:

```sh
pnpm --filter backend db:generate
pnpm --filter backend db:migrate
```

### Start clean

Two commands, because two owners hold the data:

```sh
docker compose --file backend/docker-compose.yml down -v
rm -rf backend/data/resources/*
```

The first command removes the named volume that holds Postgres. The second command
removes the stored Files. If you run only the first command, the Library is empty and
the copies stay on your disk. After the first command, run `pnpm run bootstrap` again
to create the store.

## Test

| Command | What it covers | What it needs |
|---|---|---|
| `pnpm --filter backend test:unit` | The domain and the use cases, with the ports mocked | Nothing |
| `pnpm --filter backend test:integration` | The adapters that talk to Postgres and to the disk | Docker |
| `pnpm --filter backend test:e2e` | The endpoints, over the application booted in process | Docker |
| `pnpm --filter backend test:eval` | How good a Search is | Docker and the models |

The root scripts with the same names run the same tests.

`test:integration`, `test:e2e` and `test:eval` share one test infrastructure: one
container with the Postgres image of `docker-compose.yml`, the migrations, and a temp
directory for the Files. Each run starts its own container, and each suite wipes the
data before it starts. No test touches `backend/data/`.

No test loads a model. The tests use fake models, and the evals measure the real
ones.

### The evals

An eval gives a score, not a pass or a fail. It ingests the corpus of `evals/`
through the application, which takes minutes, and runs the Search that ships. The
runner prints the score of each case beside the score of the previous run, and
writes a report into `evals/reports/`. Git versions the reports, so a change of
model or of cutter carries its evidence in the same commit.

Each report gives a verdict against the previous report: "win", "loss" or "tie", for
the `tuning` and the `holdout` subjects. The verdict of `holdout` is the one that
counts. CI never runs the evals, because CI never downloads a model.

The words of the evals, such as F0.5, `tuning`, `holdout` and the verdict, are in
[`docs/evals-glossary.md`](../docs/evals-glossary.md).

## Structure

```
src/api/            The HTTP edge: routes, controllers, middlewares and the env.
                    No business logic.
src/core/           The business, split by capability into modules.
  resources/        Create, delete and get the Resources.
  ingestion/        Read a File, cut it, embed it and store it.
  search/           Run a Search and give the Matches.
  shared/           What the modules share: the models, the bus, the store of the
                    Files, the Session and the tracking of the Model calls.
  <module>/domain/          Aggregates, value objects, events and ports.
  <module>/use-cases/       One use case for each action.
  <module>/infrastructure/  The adapters of the ports: Postgres, the disk, the models.
drizzle/            The migrations.
scripts/            The script that gets the models.
evals/              The corpus, the golden sets and the reports of the evals.
data/               Git-ignored in full. The stored Files and the model store.
test/               unit/, integration/, e2e/ and eval/, each a mirror of src/.
```

The modules speak to each other through domain events on a bus. Each module writes
only its own tables.

The conventions of this package are in [`docs/adr/`](../docs/adr/), in the files
`*-convention-backend-*`: one for each kind of class or file, such as an aggregate, a
use case, a controller or a repository. Read the convention of each kind that you
change before you change it.
