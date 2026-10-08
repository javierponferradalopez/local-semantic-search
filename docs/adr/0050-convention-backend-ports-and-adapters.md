---
kind: convention
status: accepted
---

# Convention: ports, adapters and mappers

- A port is an `interface`. A repository is `<Aggregate>Repository`, in `domain/`. A service is an agent noun, in `domain/services/`: `FileStore`, `TextEmbedder`.
- An adapter is `<Tech><Port>`, in `infrastructure/<tech>/`: `DrizzleResourceRepository`, `TransformersTextEmbedder`.
- An adapter with no effect, for an integration that the config can turn off, is `Silent<Port>`, in `infrastructure/`: `SilentModelCallRecorder`.
- A mapper is an exported object `<Aggregate>Mapper`, beside its adapter, with `toDomain()` and `toRow()`.
