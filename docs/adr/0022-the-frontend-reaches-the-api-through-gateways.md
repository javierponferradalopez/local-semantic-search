# The frontend reaches the API through gateways

**`frontend/src/api/` is replaced by one port for each context of the backend
that has an HTTP edge, with one HTTP adapter behind it.** Today there is one
port, `ResourceGateway`, and `HttpResourceGateway` implements it. A component
never calls `fetch`, and it never names an adapter. `main.tsx` builds the
adapters and puts them in a context, and a component asks a hook for its
gateway.

The old folder was already a layer: no component called `fetch`. What it did
not give is a seam. A function that a component imports by module cannot be
replaced in a test, so the change is not a new layer. It is the same layer,
declared as an `interface` and injected.

## Why the word is "gateway" and not "service"

In this repository *service* already has a meaning: a port that the domain
declares, as in `core/shared/domain/services/` (`FileStore`, `EventBus`,
`TransactionRunner`) and `ContentTypeResolver`.
[ADR-0003](0003-two-contexts-share-one-glossary.md) says that the contexts share
one glossary, and that a word which changes its meaning on one side breaks the
arrangement. *Gateway* says what the object does, which is to speak to something
outside, and it takes no word that is already in use.

`api/` was refused for the same kind of reason: it names the other party, not
the work.

## Why the gateway does not map the wire

A layer that translates the responses into types of its own was refused.
[ADR-0013](0013-an-error-is-a-list-of-codes.md) accepts a dialect in the API
because it has "one consumer, in the same repository, which shares its types".
A mapping would throw that argument away and would give two shapes of
`ResourceRow` to keep in step. The gateway returns the types of `contract/`.

For the same reason the failure keeps one channel. The port throws `Refusal`,
which holds `ErrorItem[]` and nothing of HTTP. A port that returns a result
would put back the branch that ADR-0013 paid to remove, because the network
failure must still be caught. `fetchOrRefuse` in the adapter is the only place
where a response that is not ok becomes a `Refusal`.

## Why a typed context and not a container

`api/config/di/Container.ts` resolves a graph of four layers by name, and an
`interface` has no name at run time. The frontend builds two objects in one line
each. The context holds a plain object, `{resources: ResourceGateway}`, so the
compiler says when a gateway is missing, and nothing throws in the middle of a
render. What the container is truly for, which is one point of composition, the
context keeps: that point is `main.tsx`.

## The shape

```
src/gateways/ResourceGateway.ts          the port
src/gateways/Refusal.ts                  its vocabulary of failure
src/gateways/http/HttpResourceGateway.ts the adapter
src/gateways/http/fetchOrRefuse.ts       its collaborator, which makes the Refusal
src/gateways/http/fetchJson.ts           the same, for a response with a body
src/config/GatewaysContext.tsx           the context, the provider and the hook
```

`gateways/` is to the port what `domain/` is in the backend, `gateways/http/`
what `infrastructure/` is, and `config/` what `api/config/di/` is. The rule is
visible: nothing under `src/gateways/*.ts` imports `react`, and nothing outside
`src/gateways/http/` calls `fetch`.

The two adapters to come share a collaborator, `fetchOrRefuse`, and not a parent
class. `DrizzleResourceReader` and `DrizzleResourceRepository` share
`DrizzleConnection` in the same way.

## Consequences

- **One gateway for each context, and the methods grow inside it.** A call that
  is new never asks where it goes: the context that owns the route decides.
  `SearchGateway` appears with the first route of the search.
- **The port declares only what the API serves.** `list()` and
  `createTextResource(file)` today. `delete`, `retry` and `createImageResource`
  arrive in the commit that adds their route, not before.
- **A method drops the noun that the port already says whole, and never cuts a
  compound term in half.** `list()`, because `ResourceReader.getNewestFirst()`
  in the backend does the same. `createTextResource(file)`, because *Text* alone
  is not a word of the glossary.
- **The frontend gets Vitest.** The seam is the reason for the change, so a
  seam that no test stands on is decoration. `frontend/vitest.config.ts` has one
  mode, `unit`, in the shape of the configuration of the backend, so a second
  mode has a place when the adapter must answer to a false server.
