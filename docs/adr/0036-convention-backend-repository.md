---
kind: convention
status: accepted
---

# Convention: repository methods

The name and the folder of a repository are in [ADR-0031](0031-convention-backend-ports-and-adapters.md). This convention gives its methods.

- The reads:
  - `find(id)` gives the aggregate, or `undefined`.
  - `findBy<Field>(value)` finds by a different field: `findByChecksum(checksum)`.
  - `findManyBy<Field>(value)` gives a list.
  - `findAll()` gives all of them.
  - A read never throws because a row is missing. The use case decides.
- The writes take the full aggregate:
  - `create(aggregate)` inserts a row. It fails when a row holds the same `id`.
  - `update(aggregate)` changes a row that exists. It never inserts. When the row is gone, it changes nothing and does not fail.
  - `delete(aggregate)` removes the row.
  - The plural forms are `createMany(aggregates)` and `updateMany(aggregates)`.
  - `deleteManyBy<Key>(key)` removes all the rows that hold a key: `deleteManyByResourceId(resourceId)`.
- Do not use `save`, `upsert` or `put`. An upsert that changes the state of an aggregate can write again a row that a concurrent delete removed.
- A write takes the full aggregate, also when it changes one field. The rules stay in the domain, and the adapter holds no rule.
- There is one exception: an atomic write of one value, when a race makes a write of the full aggregate incorrect. For example, an increment. Obey all these rules:
  1. Use it only when `update(aggregate)` cannot prevent the race. Speed or ease is not a reason.
  2. Give it the name of the domain act: `incrementViewCountOf(id)`. Do not use a general name, such as `patch(id, fields)` or `updateField()`.
  3. The SQL does the atomic operation and nothing more. The domain checks the rules before the write, in the aggregate or in a value object.
  4. The aggregate registers the event of the act in a method that does not change its state. The use case calls that method, and then the repository.
  5. A one-line comment on the port method tells which race makes it necessary.
