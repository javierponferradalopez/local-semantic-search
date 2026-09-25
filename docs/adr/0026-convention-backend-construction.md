---
kind: convention
status: accepted
---

# Convention: construction

- A constructor takes one object argument, typed `ConstructorParams`.
- A value object, an aggregate and an error have a private constructor. Static factories build them: `of()` validates, `create()` makes a new aggregate, `random()` makes a new identity, and `fromPrimitive()` or `fromPrimitives()` rebuilds from stored data with no validation. Only mappers and test builders call `fromPrimitive(s)()`.
- A use case, an adapter, a controller and a domain event have a public constructor. An adapter that loads a model is the exception: an asynchronous static factory builds it, so no half-loaded instance exists.
- A field is `private readonly _name`, read through `public get name()`.
- Each member states its accessibility and its return type.
