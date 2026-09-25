---
kind: convention
status: accepted
---

# Convention: ports, adapters and mappers

- A port is an `interface`. A repository is `<Aggregate>Repository`, in `domain/`. A service is an agent noun, in `domain/services/`: `FileStore`, `TextEmbedder`.
- An adapter is `<Tech><Port>`, in `infrastructure/<tech>/`: `DrizzleResourceRepository`, `TransformersTextEmbedder`.
- A mapper is an exported object `<Aggregate>Mapper`, beside its adapter, with `toDomain()` and `toRow()`.
