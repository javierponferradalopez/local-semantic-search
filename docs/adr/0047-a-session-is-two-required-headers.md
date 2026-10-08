---
kind: decision
status: accepted
---

# A Session is two required headers

**Each client sends its Session in two headers: `Session-Id`, a UUID, and
`Session-Origin`, `mcp` or `interface`. All the routes of the API require the
two, except `/files`. When one is missing or has a wrong value, the API gives
`401` with the code `unauthenticated`. There is no login.** The bus carries the
Session to each handler in an envelope, so an Ingest after the response belongs
to the Session that caused it.

This amends [ADR-0044](0044-the-mcp-server-is-a-client-of-the-http-api.md):
the backend now knows the value `mcp` of the Origin. It still has no dependency
on the package `mcp`. Decided in
[How the Session reaches the backend and the Ingest](https://github.com/javierponferradalopez/local-semantic-search/issues/130)
and
[Whether a Session records its origin, and how](https://github.com/javierponferradalopez/local-semantic-search/issues/133).

## Why two headers

The Cost of a Session is the sum of the Cost of its Model calls, so each Model
call must know its Session. Only the client knows when a Session starts: the
MCP server makes a UUID when it starts (one stdio process is one conversation
of an agent), and the frontend makes a UUID when the app loads (a reload of the
tab starts a new Session).

The Origin lets us compare the Cost of agents and of persons. The route cannot
tell it: both clients call `GET /search` and `GET /resources/texts/:id/matches`.

`/files` is free: an `<img>` cannot send a header, and `/files` calls no model.

## Why `401`

A request with no Session is a client that did not identify itself. `401` with
the code `unauthenticated` tells the client "you are not logged in". The two
clients make the Session themselves, so a `401` is a bug of the client, and the
client shows it as a `Refusal`.

## Why an envelope in the bus

An `AsyncLocalStorage` that a middleware opens reaches each listener of
emittery, also after the `201`. But an out-of-process bus cannot carry an async
context. The bus puts the Session in an envelope `{event, metadata: {session}}`
when it publishes, and opens that Session around each handler. `DomainEvent`
does not change: the Session is not a fact of the domain event.

## Considered options

- **Infer the Origin from the `User-Agent`.** Refused: it is fragile. A `curl`
  or a script fits neither value.
- **A `POST /sessions` that registers the Session and its Origin.** Refused: the
  backend keeps state, and a restart loses it.
- **The Session as a field of the payload of each event.** Refused: each event
  and each handler changes for a value that no rule of the domain reads.
- **The async context alone, with no envelope.** Refused: it ends at the edge of
  the process.

## Consequences

- **Each test of the API sends the two headers.**
- **Code that a request does not start has no Session.** `SessionRunner.current()`
  throws there. The eval opens no Session: it uses the silent adapters.
- **A login, one day, is a new term.** The Session of a user who logs in is not
  this Session.
