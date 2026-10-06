---
kind: decision
status: accepted
---

# The frontend has two routes and one upload drawer

**The frontend uses `react-router` in declarative mode, with two routes: `/` for
the Search and `/library` for the Library.** A header on all the routes holds a
link to `/`, a link to `/library` and the button that opens the upload drawer.
The upload of a File happens only in that drawer.

Decided in
[The user searches first and uploads from a side panel](https://github.com/javierponferradalopez/local-semantic-search/issues/125).

## The rules

- `main.tsx` puts `BrowserRouter` around `App`, and `App` declares the `Routes`.
  The header uses `Link` and `NavLink`. There is no data router, no loader and
  no action.
- The Vite proxy does not change: `/library` is not one of `/resources`,
  `/files` or `/search`.
- The open state of the drawer is in `App`, above the routes. The header and the
  empty state of each route open the same drawer.
- The drawer holds the drop zone, the refusal of the upload and the list of the
  Resources that a create made since the page loaded. That list reads the store
  of the Resources, so the poll of
  [ADR-0039](0039-the-frontend-polls-the-ingest-state-while-a-resource-is-ingesting.md)
  moves it. A reload clears it.
- A test mounts `App` at a route with the option `route` of
  `renderWithGateways`, which puts a `MemoryRouter` around the `ui`.

## Why

The page had one route. The Library was at the top, and the Search was below the
table of all the Resources, so the more Resources the user created, the farther
down the Search went. The Search is the main task, so it gets the page `/`.

The declarative mode is sufficient: the data comes from the store of the
Resources and from the gateways
([ADR-0022](0022-the-frontend-reaches-the-api-through-gateways.md)), not from a
loader of the router.

## Consequences

- **A new page is a new `Route` in `App`.** Its address must not start with a
  prefix of the Vite proxy.
- **The upload has one place.** A page that wants an upload opens the drawer. It
  does not get a drop zone of its own.
