---
kind: decision
status: accepted
---

# The MCP server is a client of the HTTP API

**`mcp/` is a package of the workspace and its own process. It calls the HTTP
API of the backend, as the frontend does. The backend has no dependency on
`mcp`, and it does not know that `mcp` exists.** The first version speaks only
stdio, and the tools do not depend on the transport.

This amends [ADR-0013](0013-an-error-is-a-list-of-codes.md): the API has a
second consumer, and it shares the types of `contract/`.
Decided in
[An agent finds the content through MCP](https://github.com/javierponferradalopez/local-semantic-search/issues/79).

## Why a client of the API

The HTTP API is already the edge of the backend. It validates each input, it
gives each failure as a list of codes
([ADR-0013](0013-an-error-is-a-list-of-codes.md)), and `contract/` gives its
types. A second edge would give the use cases a second set of entries to keep in
step.

ADR-0013 accepts a dialect in the API because its consumer is "in the same
repository, which shares its types". `mcp` is a second consumer of the same
kind: it imports the types of `contract/`, so a change of the API is a compile
error in `mcp`, and not a failure in the agent.

The frontend and the agent get the same Search, with the same `Floor` and the
same `Margin` ([ADR-0042](0042-a-floor-gates-a-group-and-a-margin-cuts-it.md)).
`mcp` cuts nothing.

## Why only stdio

The agent client starts `mcp` as a child process with one line of
configuration. `mcp` opens no port, so the content does not leave the machine.

A tool gets the MCP server and never a transport. Only the entry point knows
stdio. A second transport, for example Streamable HTTP, is a new entry point for
the same server, with no change to the tools.

stdout is the channel of the protocol. So nothing in `mcp` writes to stdout: a
log goes to stderr.

## The address of the backend

`BACKEND_URL` is required, and the code has no default. `mcp` throws at start
when it is missing, as the backend does with `PORT`.

`mcp` does not check the backend at start, and it does not stop when the
backend does not answer. A call while the backend is down, or while it loads its
models ([ADR-0008](0008-the-embedders-load-before-the-server-listens.md)), gives
an error that names `BACKEND_URL` and says how to start the backend. The next
call works when the backend is up, with no restart of the agent client.

The API gives the URL of a `File` and of a thumbnail relative to the backend
([ADR-0012](0012-the-api-gives-a-url-not-the-bytes.md)). An agent cannot open a
relative URL, so `mcp` resolves each URL against `BACKEND_URL` with
`new URL(url, BACKEND_URL)`. This is not a prefix: an absolute URL, which a
remote store will give, stays as it is. So the rule of ADR-0012, "the client
must not parse the URL, and must not put a prefix in front of it", still holds.

## The shape

```
mcp/src/main.ts                      the entry point: env, gateways, server, stdio
mcp/src/env.ts                       reads BACKEND_URL
mcp/src/server/createServer.ts       builds the MCP server from the gateways
mcp/src/gateways/                    the ports and their failures
mcp/src/gateways/http/               the HTTP adapters and their collaborators
mcp/src/tools/<tool-name>/           one tool and its presentation
```

`gateways/` and `gateways/http/` have the shape of the frontend
([ADR-0022](0022-the-frontend-reaches-the-api-through-gateways.md)).
`createServer` is the one point of composition of the tools, as `main.tsx` is in
the frontend. Two conventions give the rules:
[the gateways](0045-convention-mcp-gateways.md) and
[the tools](0046-convention-mcp-tools.md).

## What this costs

- **Two processes.** The user starts the backend, and the agent client starts
  `mcp`. A call before the backend is up gives an error, not an answer.
- **`mcp` gives only what the API serves.** For example, no score: the API gives
  no score and no relevance band, for the reasons in ADR-0042. A logit or a
  cosine has no meaning for the agent, and a band removes no noise from the low
  zone above the `Floor`. The empty group is the only signal.
- **One more hop.** Each call goes through HTTP on the same machine. A Search
  costs about 820 ms in the backend, so the hop is small.

## Considered options

- **An `/mcp` endpoint in the backend that calls the use cases.** One process,
  and the models are already loaded. Refused: the backend knows about MCP, and
  the use cases get a second edge that does not share the validation and the
  errors of the API.
- **A library that the backend mounts.** Refused: the backend depends on it, so
  a change of the MCP SDK is a change of the backend.

## Consequences

- **The backend does not change for `mcp`.** What `mcp` needs and the API does
  not serve is a change of the API first, for the frontend and the agent
  together.
- **No tool changes content.** The tools read: they do not create, delete or
  retry a `Resource`.
- **`mcp` runs with `tsx`, with no build**, as the backend does in `pnpm dev`.
  A change of the code takes effect on the next start.
- **The tests stand on two seams.** A tool is tested through an MCP client of
  the SDK, in memory, with false gateways (`unit`). An adapter is tested against
  a false HTTP server (`integration`). No test starts `mcp` over stdio against a
  real backend.
