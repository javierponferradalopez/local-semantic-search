---
kind: convention
status: accepted
---

# Convention: aggregate

- A noun with no suffix, with a `<Name>Primitives` type: `TextResource`, `TextResourcePrimitives`.
- It extends `AggregateRoot<<Name>Primitives>` and implements `toPrimitives()`.
- Its creation and each mutation call `registerEvent()` with a domain event: `create()` registers `<Aggregate>CreatedDomainEvent`. `fromPrimitives()` registers none, because it rebuilds an aggregate that exists. The use case takes the events with `pullEvents()`.
