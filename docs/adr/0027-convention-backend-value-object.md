---
kind: convention
status: accepted
---

# Convention: value object

- A noun with no suffix: `ResourceId`, `ChunkText`.
- It extends `ValueObject<T>`. A constant `VALUE_OBJECT_NAME` names it in its error messages.
- `of()` throws a `ValueObjectError`, made by a `causeIt…()` factory: `ValueObjectError.causeItIsEmpty(VALUE_OBJECT_NAME)`.
