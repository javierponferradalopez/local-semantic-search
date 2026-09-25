---
kind: convention
status: accepted
---

# Convention: error

- `<Thing>Error`, extends `DomainError`, in `domain/errors/`.
- Static `cause…()` factories make it, and each one says the cause: `ResourceNotFoundError.causeNoResourceHoldsTheIdentifier(id)`.
