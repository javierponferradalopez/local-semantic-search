---
kind: convention
status: accepted
---

# Convention: domain event

- The class and its file are `<Aggregate><PastParticiple>DomainEvent`: `TextResourceCreatedDomainEvent`.
- The glossary, the ADRs and the specs write the name with no suffix: `TextResourceCreated`.
- It lives in `domain/events/` of the module that raises it. It extends `DomainEvent`.
- It carries `aggregateId` and plain values: strings, numbers and the types of `contract/`.
- A static `EVENT_NAME` names it on the bus, `<module>.<aggregate>.<past_participle>`: `resources.text_resource.created`. Its getter `eventName` gives the same value, typed `typeof <Event>.EVENT_NAME`, so that two events with the same fields stay two types.
