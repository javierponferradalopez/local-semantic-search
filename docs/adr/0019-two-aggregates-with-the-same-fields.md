---
kind: decision
status: accepted
---

# A Text Resource and an Image Resource are two aggregates with the same fields

`resources/` holds two aggregates, `TextResource` and `ImageResource`, in two
tables, with the same seven fields: name, `Content type`, key of the `File`,
`Checksum`, `createdAt`, `Ingest state` and `Reason`. Every mutation route
carries the type. Every read is transversal.

Decided in
[What the ingest stage looks like in code](https://github.com/javierponferradalopez/local-semantic-search/issues/22),
which revises §6 of
[The contract between the browser and the API](https://github.com/javierponferradalopez/local-semantic-search/issues/20)
as #20 declared it would, and moves the fork that
[The words this project uses](https://github.com/javierponferradalopez/local-semantic-search/issues/9)
put below `Resource` up to the aggregate.

## Why two, when no field differs

The owner's argument: the business of an image and of a PDF is not the same, and
the code must say so in its types, not in a branch on a value. Where they differ
is what the `Ingest` produces and what a deletion must remove. Each aggregate
raises its own events (ADR-0017), so each has its own handler in `ingestion`,
and no use case branches on `Content type`.

## What it costs

- `Checksum` uniqueness is per table. The same bytes under two `Content type`, a
  PNG uploaded as `.png` and as `.txt`, are two Resources. The glossary now says
  the `Checksum` is the identity of the content within its `Content type`.
- The list of #10 is a `UNION ALL` over two tables, ordered by `createdAt`. It
  was a read model already.
- A new `Content type` that yields a new kind of content costs an aggregate, a
  table, a pair of routes and a handler. One that yields `Chunk` or `Picture`
  costs a row in the table of #17, as before.

## The routes

`POST /resources/texts` and `POST /resources/images`; `DELETE` and
`POST …/retry` under each; `GET /resources/texts/:id/matches`, because an image
row never has that link. `GET /resources` and `GET /search` are transversal. The
browser picks the upload route from the extension table of `contract/`, and the
`Gate` of each route accepts only the extensions of its type, from the same
table. `contract/` declares, per controller method, its request and its
response. The ids are plain UUIDs: the route names the table.

Rejected: a typed id such as `txt_…`, unnecessary once the route carries the
type; a base table with two empty child tables, which is an empty shape; and one
`POST /resources` that dispatches by extension, which leaves the upload blind to
the type when delete and retry are not.
