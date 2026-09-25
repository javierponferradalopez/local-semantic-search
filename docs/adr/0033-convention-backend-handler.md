---
kind: convention
status: accepted
---

# Convention: handler

- `<DoY>On<X>`, in `use-cases/` of the module that reacts: `IngestTextResourceOnTextResourceCreatedOrRetried`. When two events cause the same work, one handler subscribes to the two, and its name joins them with `Or`.
- It implements `DomainEventHandler`. `subscribeTo()` gives the class of each event, and the type of the handler must accept it, and `handle()` does the work, as the `run()` of a use case does.
- `RegisterDomainEventHandlers` in `api/config/di/` makes it and subscribes it to the bus.
