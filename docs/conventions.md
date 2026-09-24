# Conventions

The shape of the code in `backend/`.

## Files and folders

- One exported class, or one exported object, in each file. The file has its name, in PascalCase. Folders are kebab-case. Import each file by its relative path.
- A module is `core/<module>/` with `domain/`, `use-cases/` and `infrastructure/`. `domain/` holds `errors/`, `events/`, `services/` and `value-objects/`. `infrastructure/` holds one folder for each technology: `drizzle/`, `transformers/`.
- `core/shared/` has the folders of a module, except `use-cases/`.

## Construction

- A constructor takes one object argument, typed `ConstructorParams`.
- A value object, an aggregate and an error have a private constructor. Static factories build them: `of()` validates, `create()` makes a new aggregate, `random()` makes a new identity, and `fromPrimitive()` or `fromPrimitives()` rebuilds from stored data with no validation. Only mappers and test builders call `fromPrimitive(s)()`.
- A use case, an adapter, a controller and a domain event have a public constructor. An adapter that loads a model is the exception: an asynchronous static factory builds it, so no half-loaded instance exists.
- A field is `private readonly _name`, read through `public get name()`.
- Each member states its accessibility and its return type.

## Value object

- A noun with no suffix: `ResourceId`, `ChunkText`.
- It extends `ValueObject<T>`. A constant `VALUE_OBJECT_NAME` names it in its error messages.
- `of()` throws a `ValueObjectError`, made by a `causeIt…()` factory: `ValueObjectError.causeItIsEmpty(VALUE_OBJECT_NAME)`.

## Aggregate

- A noun with no suffix, with a `<Name>Primitives` type: `TextResource`, `TextResourcePrimitives`.
- It extends `AggregateRoot<<Name>Primitives>` and implements `toPrimitives()`.
- Its creation and each mutation call `registerEvent()` with a domain event: `create()` registers `<Aggregate>CreatedDomainEvent`. `fromPrimitives()` registers none, because it rebuilds an aggregate that exists. The use case takes the events with `pullEvents()`.

## Domain event

- The class and its file are `<Aggregate><PastParticiple>DomainEvent`: `TextResourceCreatedDomainEvent`.
- The glossary, the ADRs and the specs write the name with no suffix: `TextResourceCreated`.
- It lives in `domain/events/` of the module that raises it. It extends `DomainEvent`.
- It carries `aggregateId` and plain values: strings, numbers and the types of `contract/`.

## Error

- `<Thing>Error`, extends `DomainError`, in `domain/errors/`.
- Static `cause…()` factories make it, and each one says the cause: `ResourceNotFoundError.causeNoResourceHoldsTheIdentifier(id)`.

## Ports, adapters and mappers

- A port is an `interface`. A repository is `<Aggregate>Repository`, in `domain/`. A service is an agent noun, in `domain/services/`: `FileStore`, `TextEmbedder`.
- An adapter is `<Tech><Port>`, in `infrastructure/<tech>/`: `DrizzleResourceRepository`, `TransformersTextEmbedder`.
- A mapper is an exported object `<Aggregate>Mapper`, beside its adapter, with `toDomain()` and `toRow()`.

## Use case

- A verb phrase with no suffix, in `use-cases/`: `RetryTextResource`.
- Its `ConstructorParams` holds its ports. Its one public method is `run()`, with one object argument of primitives. It builds the value objects.

## Handler

- A thin subscriber in `infrastructure/` of the module that reacts to the event. It calls one use case.

## Controller

- `<Action><Resource>Controller`, in `api/controllers/<resource>/`: `RetryTextResourceController`.
- It holds one use case. Its method `run(request, response)` parses the input with Zod and gives primitives to the use case.

## Tests

- `<Subject>.test.ts`, under `test/unit/`, `test/integration/` or `test/e2e/`, at the path that mirrors `src/`.
- `describe('<Subject>')` holds one `describe` for each member: `'.of'` for a static, `'#run'` for an instance method. Each case is `it('should …')`.
- Test data comes from `<Type>Mother` in `test/utils/object-mother/` and `<Aggregate>Builder` in `test/utils/builders/<aggregate>/`. A builder has `a<Aggregate>()`, `with<Field>()` and `build()`, and `build()` calls `fromPrimitives()`.
