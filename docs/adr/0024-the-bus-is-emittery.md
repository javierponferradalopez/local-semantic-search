---
kind: decision
status: accepted
---

# The bus is emittery, and the publisher chooses to wait

The bus is `EmitteryEventBus`, an adapter of the port `EventBus` on the library
[emittery](https://github.com/sindresorhus/emittery). It replaces the bus that
was written by hand. `publish()` gives a promise that ends when the handlers
end, and the publisher chooses to wait or not.

Amends the section "The bus" and the consequence on the handlers of
[ADR-0017](0017-three-contexts-speak-by-domain-events.md).

## The contract

- The port has two methods: `publish(events)` and `subscribe(handler)`. So the
  code that subscribes the handlers needs no method of the adapter.
- The bus finds the handlers of an event by a name that the event declares, not
  by the name of its class. A bundler can change the name of a class, and two
  modules can use the same one.
- The handlers of one event run at the same time, in no order.
- When a handler throws, the other handlers still run, and the promise of
  `publish()` rejects. The adapter logs the error on that same promise, so a
  publisher that does not wait leaves no unhandled rejection.
- The publisher publishes after its transaction commits. Nothing persists, as
  ADR-0017 says.

## The publisher chooses

A use case publishes with `void` by default. It waits with `await` only when it
needs the handlers to end. The upload does not wait, so the `201` does not wait
for the `Ingest` ([ADR-0018](0018-the-ingest-runs-after-the-response.md)).

ADR-0017 put this rule in the bus: the publisher never waits. A bus that always
returns at once cannot wait when a use case needs it to. So the rule moves to
the use case, and a test of each use case proves that it does not wait.

## The handler does the work

A handler is application code, and it does the work itself, with no use case
behind it. ADR-0017 had a thin subscriber in `infrastructure/` that called a use
case: a layer with no work in it. When two events cause the same work, one
handler subscribes to the two. The handler still catches its own errors, and the
handlers of `ingestion` still turn any `throw` into an `…IngestFailed`.

## Consequences

- A handler is proved in unit with its ports mocked and no bus. The adapter is
  proved alone.
- An e2e does not wait for the bus. It reads the row through the API until the
  row leaves `Ingesting`, with a time limit.
