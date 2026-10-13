# frontend

The web interface of the product. A person uses it to upload files, to see the
Library of their Resources, and to search them. It is a client of the HTTP API of the
[backend](../backend/README.md).

It uses React, Vite and React Router, and it is styled with shadcn/ui on Tailwind.

## The screens

- **Search** (`/`). A search box and the Results in two groups: text and images. A
  text Result shows the passage that matched and its page, and it can show more
  Matches of the same Resource. With no Query, the page shows the Resources that were
  created most recently.
- **Library** (`/library`). All the Resources, with their Content type, their Ingest
  state and their creation date. A `Failed` Resource shows its Reason. From here you
  delete a Resource.
- **Upload.** A drawer that each screen opens. You drop a file or pick one, and it
  becomes a Resource.

While a Resource is `Ingesting`, the interface asks the backend again for the
Resources until the Ingest ends.

Each tab of the browser is one Session, with the Origin `Interface`. A reload of the
tab starts a new Session.

## Configuration

The frontend has no `.env`. The Vite dev server sends `/resources`, `/files` and
`/search` to the backend on `http://localhost:3001`. The address is in
`vite.config.ts`.

## Installation

From the root of the repository:

```sh
pnpm install
```

The frontend needs the backend to show data, so run `pnpm run bootstrap` too. The
[root README](../README.md#quick-start) gives the full setup.

## Start

From the root, `pnpm dev` starts the backend and the frontend together. To start only
the frontend:

```sh
pnpm --filter frontend dev
```

It listens on `http://localhost:5173`. If the backend does not run, the screens show
an error.

To build and serve the production bundle:

```sh
pnpm --filter frontend build
pnpm --filter frontend preview
```

## Test

```sh
pnpm --filter frontend test:unit
```

The unit tests render the components in jsdom with Testing Library. The gateways are
mocked, so the tests need no backend.

## Structure

```
src/App.tsx       The header, the two routes and the Upload drawer.
src/sections/     One component for each route: Search and Library.
src/search/       The parts of the Search screen.
src/library/      The parts of the Library screen and of the drop zone.
src/components/   The components that more than one screen uses.
  ui/             The shadcn/ui components.
src/gateways/     The ports to the backend. http/ holds the adapters that use fetch.
src/resources/    The React context that holds the Resources.
src/config/       The React context that gives the gateways.
src/errors/       The texts that the user reads for each error code and Reason.
test/unit/        The unit tests, a mirror of src/.
```

A component reaches the backend only through a gateway, never through `fetch`.

The conventions of this package are in [`docs/adr/`](../docs/adr/), in the files
`*-convention-frontend-*`. Read them before you change a component.
