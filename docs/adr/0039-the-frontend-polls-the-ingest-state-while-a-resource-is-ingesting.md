---
kind: decision
status: accepted
---

# The frontend polls the Ingest state while a Resource is Ingesting

**While at least one Resource of the list is `Ingesting`, the frontend asks for
the list of Resources every 2 seconds, and the answer replaces the list.** The
Library and "Recently created" read that one list, so a Resource changes from
`Ingesting` to `Ready` or `Failed` in both, with no reload.

Decided in
[One look, a search as you type, and an Ingest state that moves](https://github.com/javierponferradalopez/local-semantic-search/issues/70).
Supersedes only the point "No polling and no server-sent events" of
[ADR-0018](0018-the-ingest-runs-after-the-response.md). Its other points stay.

## The rules

- The poll calls `ResourceGateway.list()`, through the gateway hook of
  [ADR-0022](0022-the-frontend-reaches-the-api-through-gateways.md). It adds no
  gateway method and no route: `GET /resources` stays the only source of the
  Ingest state.
- The poll runs only while a Resource of the list is `Ingesting`. When a create
  or a Retry makes a Resource `Ingesting`, it starts again.
- The poll stops while `document.visibilityState` is `hidden`. When the tab is
  `visible` again and a Resource is still `Ingesting`, the next tick comes 2
  seconds later.
- The frontend schedules the next tick when the response of the last tick
  arrives. It never uses a fixed `setInterval`, so two requests of the poll
  never overlap.
- A failed tick shows no alert, keeps the last list and tries again at the next
  tick.
- A tick that succeeds removes the refusal of the load on mount, because it
  gives the whole list.
- A Resource that the user creates or retries while a list is in flight keeps
  the row of the user, also when that list does not hold it or holds an older
  row.
- The poll does not run the search again. A Resource that becomes `Ready` shows
  in the Results at the next search.

## Why a poll, and not server-sent events

ADR-0018 left the Ingest state still until a reload, so the user could not see
when a Resource became `Ready` or `Failed`. The list route already gives the
Ingest state of each row. A poll of that route needs no new route, no open
connection and no change of the backend. An `Ingest` takes seconds, so an
interval of 2 seconds is sufficient, and the poll stops when nothing is
`Ingesting`, so an idle page does no work.

## What this costs

- A Resource that a stopped process leaves in `Ingesting` (ADR-0018) keeps the
  poll alive while its tab is visible. That is one small request every 2
  seconds, until a delete or the future cron repairs the row.
- A delete while a tick is in flight can bring the row back for one tick. The
  next tick removes it, if a Resource is still `Ingesting`.
