# Modules depend inward, and each module writes only its own aggregates

`resources/`, `ingestion/` and `search/` are **modules of one bounded context**,
not three contexts. [ADR-0003](0003-two-contexts-share-one-glossary.md) applied
the test of language and found one context: `Resource`, `Chunk` and `Picture`
mean the same thing in each module. The folders cut the code by capability, not
by language. So a module can use the model of another module, and the rule that
limits the imports is the direction of the layers, not the module.

Amends [ADR-0017](0017-three-contexts-speak-by-domain-events.md), which allowed
only `domain/events/` between `resources` and `ingestion`, and
[ADR-0003](0003-two-contexts-share-one-glossary.md), which said that `search/`
never imports `Resource`.

## The rules

1. Between modules, a dependency points inward, as it does inside one module:
   infrastructure → application → domain. The domain of a module never imports
   the application or the infrastructure of another module.
2. A module can import the domain of another module: its value objects, its
   events and its ports.
3. An aggregate references an aggregate of another module by its typed identity
   only. A `Chunk` holds a `ResourceId`, never a `TextResource`.
4. A use case can read through the repository of another module. It writes only
   the aggregates of its own module. To change an aggregate of another module,
   it raises an event, and the owner module does the change.
5. A use case changes one aggregate in one transaction.

## Why

The owner's rule: modules depend on each other, and this is normal. What must
stay clean is the direction of the layers. The events already made a cycle
between `resources` and `ingestion`, and the cycle did no harm. An import of
`ResourceId` is the same kind of dependency.

Rule 4 keeps the one thing that makes the ingest flow reliable: each state has
one writer. Only `resources` writes the `Ingest state`, and it writes it when it
receives the events of `ingestion`.

## Consequences

- The events stay the way a module asks another module to change. A synchronous
  call from `ingestion` into a use case of `resources` stays refused, as
  ADR-0017 says.
- [ADR-0020](0020-no-foreign-key-crosses-a-module.md) stands. No foreign key
  crosses a module, and a deletion stays a business operation by event. A free
  import in the code gives no permission for a cascade in the database.
- `core/shared/` stays. `Vector` and the embedders belong to no module, so to
  put them in one module would give them a false owner.
- A new import from the domain of `ingestion` into `resources`, other than the
  events, is a signal to examine. The cycle stays small only if it stays in few
  places.
