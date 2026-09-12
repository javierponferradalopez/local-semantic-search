# Convention sheet: `api-scaffolding`

Source: `https://github.com/javierponferradalopez/api-scaffolding`, branch `main`
(commit `5dbcfd6`). The repository is public and small: 4 commits, one bounded
context (`user`), one shared context (`cross-cutting`). Every statement below
comes from the files, not from the README.

The repository is a template. It shows the shape the owner builds in. Specs for
this project must produce the same shape.

---

## 1. Folder layout

```
api-scaffolding/
├── rest-client/API/              # Bruno HTTP collection (.bru files), one folder per resource
│   ├── Auth/ User/
│   └── environments/LOCAL.bru
├── src/
│   ├── api/                      # THE HTTP EDGE. Nothing here is business logic.
│   │   ├── main.ts               # process entry: connect DB, then start server
│   │   ├── app.ts                # builds the Express app by piping configurators
│   │   ├── config/
│   │   │   ├── connectToMongoDb.ts
│   │   │   └── di/               # the composition root
│   │   │       ├── Container.ts
│   │   │       ├── DependencyIdentifierEnum.ts
│   │   │       ├── RegisterInfrastrucureDependencies.ts   (sic, typo in repo)
│   │   │       ├── RegisterDomainDependencies.ts
│   │   │       ├── RegisterApplicationDependencies.ts
│   │   │       ├── RegisterControllersDependencies.ts
│   │   │       ├── domain/RegisterServicesDependences.ts
│   │   │       └── infrastructure/RegisterRepositoryDependencies.ts
│   │   │                         infrastructure/RegisterServicesDependencies.ts
│   │   ├── configurators/        # one file per concern, each (app) => app
│   │   │   ├── configureContainer.ts  configureDatabase.ts
│   │   │   ├── configureParsers.ts    configureMiddlewares.ts
│   │   │   ├── configureRoutes.ts     configureServer.ts
│   │   ├── controllers/
│   │   │   ├── BaseController.ts      # abstract, holds req/res + validation + senders
│   │   │   ├── HandlerController.ts   # factory: class -> Express RequestHandler
│   │   │   ├── auth/  user/  system/  # one folder per resource
│   │   │   │   └── dtos/              # request and response DTOs live beside the controller
│   │   │   └── cross-cutting/dtos/    # shared DTOs (pagination, sort, error body)
│   │   ├── env/env.ts + env/utils.ts  # the ONLY place that reads process.env
│   │   ├── middlewares/
│   │   │   ├── AuthenticatedUserMiddleware.ts
│   │   │   ├── ErrorHandlerMiddleware.ts
│   │   │   └── error-handlers/        # one class per HTTP status family
│   │   └── routes/                    # one file per resource: AuthRoutes, UserRoutes, SystemRoutes
│   ├── core/                     # THE BUSINESS. No Express here at all.
│   │   ├── cross-cutting/        # shared kernel
│   │   │   ├── domain/           # AggregateRoot, SearchCriteria, enums
│   │   │   │   ├── errors/       # DomainError, NotFoundError, ValueObjectError...
│   │   │   │   ├── event-bus/    # DomainEvent, DomainEventBus, EventHandler (all abstract)
│   │   │   │   └── value-objects/# ValueObject, StringValueObject, IdValueObject...
│   │   │   ├── infrastructure/   # EventEmitterDomainEventBus, MongooseRepository...
│   │   │   └── use-cases/        # ApplicationService, ApplicationServiceRequest
│   │   └── user/                 # ONE BOUNDED CONTEXT = one folder under core/
│   │       ├── domain/           # User.ts, UserRepository.ts, LoginToken.ts ...
│   │       │   ├── errors/  events/  services/  value-objects/
│   │       ├── infrastructure/   # adapters for this context only
│   │       │   ├── JWTLoginTokenizer.ts
│   │       │   ├── mongoose/user/…  mongoose/login-token/…
│   │       │   └── user-data-finder/…
│   │       └── use-cases/        # GetUser.ts, Logout.ts, SignUpOrLogin.ts
│   ├── types/                    # Option, Nullable, Primitive, ToPrimitives, Class, global.d.ts
│   └── utils/                    # ObjectId.ts
├── test/
│   ├── lib/test-containers/      # MongoDbTestContainer.ts
│   ├── lib/vitest/               # global.setup.infrastructure.ts, SetupWithInfrastructure.ts
│   ├── unit/core/user/domain/User.test.ts   # mirrors src path under test/unit/
│   └── utils/
│       ├── builders/<aggregate>/ # UserBuilder.ts + TestUsers.ts
│       ├── object-mother/        # StringMother.ts, NumberMother.ts
│       └── mock.ts               # re-export of vitest-mock-extended
├── .env.example  .env.test  .nvmrc  .gitignore
├── eslint.config.js  tsconfig.json  vitest.config.js  package.json  yarn.lock
```

Key rules to copy:

- **Two top folders only: `src/api` and `src/core`.** `api` is the delivery
  mechanism. `core` is the hexagon. `core` never imports from `api` (the only
  exception in the repo is `RegisterServicesDependencies.ts` reading `env`, and
  that file lives in `api`, not in `core`).
- **A bounded context is a folder under `src/core/`.** Inside it, always the
  same three folders: `domain/`, `use-cases/`, `infrastructure/`.
- **Shared code goes to `core/cross-cutting/`** with the same three folders.
- **The application layer is called `use-cases/`, not `application/`.**
- `infrastructure/` is nested per technology: `infrastructure/mongoose/user/`,
  `infrastructure/user-data-finder/`.
- Tests live in a top-level `test/` folder that mirrors `src/` under
  `test/unit/` and `test/integration/`. Tests are never beside the source.

---

## 2. Naming conventions

All source files are **PascalCase** and named exactly like the single exported
class or the single exported function. Folders are **kebab-case**
(`value-objects`, `event-bus`, `error-handlers`, `user-data-finder`,
`cross-cutting`, `use-cases`). One class per file. No `index.ts` barrels.

| Element | Rule | Real examples |
|---|---|---|
| Aggregate root | Noun, no suffix. Extends `AggregateRoot<TPrimitives>` | `User.ts` |
| Entity (not root) | Noun, no suffix, plain class | `LoginToken.ts` |
| Primitives type | `<Aggregate>Primitives`, exported from the same file | `UserPrimitives` in `User.ts` |
| Value object | Noun, no `VO` suffix | `Email.ts`, `UserId.ts`, `UserName.ts`, `UserLocale.ts`, `LoginTokenSecret.ts`, `ProviderAccount.ts` |
| Base value object | `<Kind>ValueObject` | `ValueObject.ts`, `StringValueObject.ts`, `IdValueObject.ts`, `EnumValueObject.ts`, `NumberValueObject.ts` |
| Repository port | `<Aggregate>Repository`, an `interface` in `domain/` | `UserRepository.ts`, `LoginTokenRepository.ts` |
| Repository adapter | `<Tech><Aggregate>Repository` in `infrastructure/<tech>/<aggregate>/` | `MongooseUserRepository.ts`, `MongooseLoginTokenRepository.ts` |
| Mapper | `<Tech><Aggregate>Mapper`, methods `toDomain` / `fromDomain` | `MongooseUserMapper.ts` |
| Persistence shape | `<Aggregate>Data` (plain type), `<Aggregate>Document` (extends `Data` + `mongoose.Document`), `<Aggregate>Schema`, `<Aggregate>Model` | `UserData.ts`, `UserDocument.ts`, `UserSchema.ts`, `UserModel.ts` |
| Domain service port | Agent noun, `abstract class` in `domain/services/` | `LoginTokenizer.ts` |
| Domain service (concrete) | Agent noun, plain class in `domain/services/` | `UserFinder.ts` |
| Service adapter | `<Tech><Port>` | `JWTLoginTokenizer.ts`, `OAuthApiGoogleUserDataFinder.ts` |
| Use case | **Verb phrase, no suffix.** Extends `ApplicationService<Req, Res>` | `GetUser.ts`, `Logout.ts`, `SignUpOrLogin.ts` |
| Use case request/response | Local types `RequestService` / `ResponseService`, not exported | inside `GetUser.ts` |
| Domain event | `<Aggregate><PastParticiple>DomainEvent` | `UserSignedUpDomainEvent.ts`, `UserLoggedDomainEvent.ts`, `UserLoggedOutDomainEvent.ts` |
| Domain error | `<Thing>Error`, extends `DomainError` | `UserNotFoundError.ts`, `EmailValueObjectError.ts`, `LogoutError.ts` |
| Enum | `<Name>Enum`, `SCREAMING_CASE` members | `SortDirectionEnum`, `PageDirectionEnum`, `ProviderEnum`, `DependencyIdentifierEnum` |
| Controller | `<Action><Resource>Controller` or `<Resource><Verb>Controller` | `GetMeController.ts`, `LogoutController.ts`, `HeartbeatGetController.ts`, `SSOGoogleCalbackController.ts` |
| Request DTO | `<UseCase>RequestBody` in `dtos/<UseCase>Request.ts` | `SSOGoogleCallbackRequestBody` |
| Response DTO | `<Action>Response` in `dtos/` | `GetMeResponse.ts`, `BodyErrorsResponse.ts` |
| Routes | `<Resource>Routes.ts`, exports `<Resource>Routes` function and a `<Resource>Paths` enum | `UserRoutes.ts`, `AuthRoutes.ts`, `SystemRoutes.ts` |
| Middleware | `camelCase` const `<name>Middleware`, file PascalCase | `AuthenticatedUserMiddleware.ts` exports `authenticatedUserMiddleware` |
| Configurator | `configure<Concern>.ts`, exports `configure<Concern>` | `configureRoutes.ts` |
| DI registrar | `Register<Layer>Dependencies.ts`, exports `register<Layer>Dependencies` | `RegisterApplicationDependencies.ts` |
| Test file | `<Subject>.test.ts` under the mirrored path | `test/unit/core/user/domain/User.test.ts` |
| Test builder | `<Aggregate>Builder.ts` + `Test<Aggregates>.ts` | `UserBuilder.ts`, `TestUsers.ts` |
| Object mother | `<Type>Mother.ts` | `StringMother.ts`, `NumberMother.ts` |

### Construction conventions inside classes

- Constructors are **`private`** (aggregates, VOs) or `protected` (base
  classes). Objects are created by **static factory methods**:
  - `of(...)` — the validating factory, used by the application layer.
  - `fromPrimitive(...)` / `fromPrimitives(...)` — the **non-validating**
    factory, used only by mappers when reading from the store.
  - `random()` — for identifiers.
  - `default()` — for a default value (`UserLocale.default()`).
  - A named intent factory on the aggregate: `User.signUp(...)`.
- Every aggregate has `toPrimitives(): <Aggregate>Primitives`.
- Fields are `private readonly _name`, exposed with `public get name()`.
- Constructor arguments come as a **single object** typed `ConstructorParams`.
- Errors carry named static factories that read like a cause:
  `UserNameValueObjectError.causeTooShort(value)`,
  `IdValueObjectError.causeValueIsNotUuid(value)`,
  `LogoutError.causeLoginTokenNotFound(id)`.
- Explicit accessibility (`public` / `private` / `protected`) on every member,
  and an explicit return type on every method. ESLint enforces both.

---

## 3. Ports and adapters — how they are declared and wired

### Declaring a port

Two styles, both used:

1. **`interface`** for repositories, in `domain/`:

```ts
// src/core/user/domain/UserRepository.ts
export interface UserRepository {
  findById(userId: UserId): Promise<Option<User>>;
  findByEmail(email: Email): Promise<Option<User>>;
  create(user: User): Promise<void>;
  update(user: User): Promise<void>;
}
```

2. **`abstract class`** for services and buses, because the DI container keys on
   the class name at runtime:

```ts
// src/core/user/domain/services/LoginTokenizer.ts
export abstract class LoginTokenizer {
  public abstract generateToken(email: Email): LoginTokenSecret;
  public abstract decodeToken(token: LoginTokenSecret): Email;
}
```

The adapter then `implements` the interface or `extends` the abstract class:
`class JWTLoginTokenizer implements LoginTokenizer`,
`class MongooseUserRepository extends MongooseRepository<…> implements UserRepository`.

**Rule that follows from this:** a port declared as an `interface` has no
runtime name, so it needs a string key in `DependencyIdentifierEnum`. A port
declared as an `abstract class` is its own key. The scaffolding uses the enum
only for the two repositories.

### The container

`typedi` wrapped in a thin class of the repo's own, `src/api/config/di/Container.ts`.
It exposes three methods and a module-level singleton `container`:

- `getDependency<T>(idOrClass)` — resolves by enum string or by class name.
- `registerImplementation(instance, scope?)` — registers under its own class name.
- `registerImplementationAs(instance, portClassOrEnum, scope?)` — registers an
  instance under a **port** identity. This is the port/adapter binding.
- Scope: `DependencyScope.Transient` (default) or `.Singleton`.
- Double registration throws. Missing resolution throws.

Note the important detail: the instances are **built by hand** with `new` and
then registered as factories that return the same object. There is no decorator
injection, no `@Service()`, no auto-wiring. `reflect-metadata` is imported once
in `main.ts` only because `typedi` needs it.

### The composition root and its order

`app.ts` calls `configureContainer()` before anything else.
`configureContainer.ts` calls four registrars **in this fixed order**:

```
registerInfrastructureDependencies()   // repositories, service adapters, event bus
registerDomainDependencies()           // domain services (UserFinder)
registerApplicationDependencies()      // use cases, then event handlers
registerControllersDependencies()      // controllers, built from resolved use cases
```

Inner layers register first so the outer layer can resolve them. Example of an
application binding:

```ts
container.registerImplementationAs(
  new SignUpOrLogin(
    container.getDependency(LoginTokenizer),
    container.getDependency<UserRepository>(DependencyIdentifierEnum.UserRepository),
    container.getDependency(DomainEventBus)
  ),
  SignUpOrLogin
);
```

Two adapters that need each other are wired plainly, before registration:

```ts
const loginTokenRepository = new MongooseLoginTokenRepository();
const userRepository = new MongooseUserRepository(loginTokenRepository);
```

**Rule:** all dependencies are constructor parameters,
`private readonly`, and nothing inside `core/` ever touches the container. The
container is read only from `src/api/`: the registrars, `HandlerController.ts`,
and `AuthenticatedUserMiddleware.ts`.

---

## 4. The HTTP layer

**Framework: Express 4.** Server bootstrap in two files:

```ts
// src/api/main.ts
import 'reflect-metadata';
await configureDatabase();
configureServer(createApp());
```

```ts
// src/api/app.ts
export const createApp = (): Express => {
  configureContainer();

  return pipe(
    configureParsers,
    configureBeforeMiddlewares,
    configureRoutes,
    configureMiddlewaresAfterRoutes
  )(express());
};
```

`pipe` comes from `ramda`. Each configurator has the signature
`(app: Express) => Express`. The error middleware is registered **after** the
routes, in `configureMiddlewaresAfterRoutes`.

### Routes

One file per resource. Each exports a `Paths` enum and a factory that returns a
`Router`. All routers are mounted under one prefix in `configureRoutes.ts`:

```ts
export enum UserPaths {
  GetMe = '/users/@me'
}

export const UserRoutes = (): Router => {
  const routes = Router();

  routes.get(
    UserPaths.GetMe,
    authenticatedUserMiddleware,
    getHandlerController(GetMeController)
  );

  return routes;
};
```

```ts
// configureRoutes.ts — note: the prefix is '/api', the README says '/api/v1'.
return app.use('/api', [SystemRoutes(), AuthRoutes(), UserRoutes()]);
```

### Request to use case

Controllers are **classes**, not functions. `getHandlerController(Class)`
resolves the instance from the container, calls `handler(req, res)`, and passes
any throw to `next(error)`:

```ts
export function getHandlerController<T extends BaseController>(
  controllerClass: NewableClass<T>
): RequestHandler {
  return async (request, response, next) => {
    try {
      const controller = container.getDependency(controllerClass);
      await controller.handler.call(controller, request, response);
    } catch (error) {
      next(error);
    }
  };
}
```

`BaseController` stores `request`/`response` on the instance, then calls the
abstract `execute()`. It gives subclasses:
`getBody(Dto)`, `getQuery(Dto)`, `getParams(Dto)`, `getQueryPagination()`,
`getQuerySort()`, `currentSession`, `headers`, and the senders `sendResponse`,
`sendResponseCreated`, `sendResponseNotContent` (204), `sendResponseNotFound`,
`sendResponseBadRequest`.

A controller holds **one** use case, named `useCase`, and is thin:

```ts
export class GetMeController extends BaseController {
  public constructor(private readonly useCase: GetUser) { super(); }

  public async execute(): Promise<void> {
    const user = await this.useCase.execute({userId: this.currentSession.userId});

    this.sendResponse(new GetMeResponse(user));
  }
}
```

The use case takes **primitives in** and returns a **domain object out**. The
use case, not the controller, turns primitives into value objects
(`UserId.of(request.userId)`). The response DTO takes the domain object in its
constructor and reads `toPrimitives()`.

### Validation

`class-validator` + `class-transformer`, on DTO classes with decorators:

```ts
export class SSOGoogleCallbackRequestBody {
  @IsString()
  public declare token: string;
}
```

`BaseController.getValidatedDto` runs `plainToClass` then `validateOrReject`.
A failure throws a `ValidationError[]`, which the error middleware converts.
This needs `experimentalDecorators` and `emitDecoratorMetadata` in `tsconfig`.

### Errors to responses

One middleware, a **chain of handler classes**, each with
`catchError(response): boolean`:

```ts
const errorHandlers = [
  new NotFoundErrorHandler(error),
  new BadRequestErrorHandler(error)
];

const haveCaughtError = errorHandlers.some(h => h.catchError(response));

if (!haveCaughtError) { next(error); }
```

- `NotFoundError` (a `DomainError` subclass) → 404 with the message.
- `ValidationError[]` or any `DomainError` → 400 with
  `BodyErrorsResponse`, shaped `{errors: {field: message}}`, built by
  `fromValidationError` or `fromDomainError`.
- Anything else falls to the Express default (500).

**To add a status family you add an `ErrorHandler` subclass** in
`middlewares/error-handlers/` and push it onto that array.

### Domain events

`AggregateRoot` collects events with `registerEvent`. The use case publishes
them explicitly: `this.eventBus.publish(user.pullEvents());`. The bus is
`EventEmitterDomainEventBus` (`eventemitter2`), registered as a **singleton**.
Handlers subscribe with `subscribedTo()`. The scaffolding has no handler yet —
`RegisterApplicationDependencies.ts` ends with `// handlers` / `// TODO:`.

---

## 5. Tests

### Layout

- `test/unit/**/*.test.ts` — mirrors `src/` exactly.
- `test/integration/**/*.test.ts` — the folder does not exist yet, but the
  config and the setup files for it do.
- `test/lib/` — infrastructure for tests (testcontainers, vitest setup).
- `test/utils/` — builders, object mothers, the `mock` re-export.

### Vitest configuration

`vitest.config.js` (plain JS, not TS). It switches on `--mode`, not on projects:

```js
const unitTestsConfig = {include: ['test/unit/**/*.test.ts'], exclude: []};

const integrationTestsConfig = {
  include: ['test/integration/**/*.test.ts'],
  exclude: [],
  extraConfig: {
    testTimeout: 30_000,
    globalSetup: 'test/lib/vitest/global.setup.infrastructure.ts',
    setupFiles: ['test/lib/vitest/SetupWithInfrastructure.ts']
  }
};

const pool = process.arch === 'arm64' ? 'threads' : 'forks';
```

- `globals: true` (so `describe`/`it`/`expect`/`beforeEach` are not imported;
  `tsconfig` adds `"types": ["vitest/globals"]`).
- `poolOptions[pool].isolate: false` — the suites share a process.
- An unknown mode falls back to `unit`.
- Scripts: `yarn test:unit`, `yarn test:integration`.

### Mocking boundary

`vitest-mock-extended`, re-exported through `test/utils/mock.ts` so tests never
import the library directly. **Only ports are mocked**, and only the port that
the subject under test depends on:

```ts
const tokenizer = mock<LoginTokenizer>();

beforeEach(() => { mockReset(tokenizer); });
```

Everything else is real: real value objects, real aggregates, real events. No
`vi.mock` of modules anywhere. Integration tests get a **real MongoDB in a
testcontainer** (`@testcontainers/mongodb`), started once in `globalSetup`,
with each suite given its own database name suffix so suites do not collide.

### Test writing style

- `describe('<Subject>')` at the top. Nested `describe('.staticMethod')` for
  statics and `describe('#instanceMethod')` for instance methods.
- `it('should …')`.
- Explicit `// Arrange` / `// Act` / `// Assert` comments in every test.
- Data comes from builders (`TestUsers.aUser().build()`,
  `TestUsers.aLoggedUser().build()`) and from object mothers
  (`StringMother.randomEmail()`), never from inline literals.
- Builders have a `with<Field>(value): this` per field and a `build()`.
  `Test<Aggregates>` is the static entry point with named scenarios.

### CI

Branch `feat_add_github_workflows` (not merged) adds
`.github/workflows/lint.yml` and `tests.yml`. Both run on pull requests to
`main`, read the Node version from `.nvmrc`, `yarn install`, then `yarn lint`
or `yarn test:unit`. Integration tests are not in CI.

---

## 6. Tooling

### `package.json`

```json
"type": "module",
"main": "src/api/main.ts",
"scripts": {
  "dev": "yarn run ts:check && yarn run start:watch",
  "start:watch": "tsx watch src/api/main.ts",
  "ts:check": "tsc --p . --noEmit --pretty",
  "lint": "yarn run ts:check && yarn eslint",
  "test:unit": "yarn vitest --run --mode unit",
  "test:integration": "yarn vitest --run --mode integration"
}
```

- Package manager: **yarn** (`yarn.lock`). Node `v20.14.0` (`.nvmrc`).
- ESM (`"type": "module"`), run straight from TypeScript with `tsx`. There is
  **no build script** and no `start` script for production.
- `lint` always runs the type check first.
- Runtime deps: `express`, `mongoose`, `typedi`, `reflect-metadata`,
  `class-validator`, `class-transformer`, `ramda`, `eventemitter2`,
  `jsonwebtoken`, `axios`, `dotenv`, `tslib`.
- Dev deps: `vitest`, `vitest-mock-extended`, `@faker-js/faker`,
  `@testcontainers/mongodb`, `tsx`, `typescript ~5.4.5`, eslint stack.

### `tsconfig.json`

Single file at the root, covers `src/**/*` and `test/**/*`.

- `target`/`module`: `esnext`; `moduleResolution: node`.
- `strict: true`, plus `noImplicitAny`, `strictNullChecks`, `noImplicitThis`,
  `alwaysStrict`, `noUnusedLocals`, `noImplicitReturns`,
  `noFallthroughCasesInSwitch`.
- `noUnusedParameters: false`, `useUnknownInCatchVariables: false`.
- `experimentalDecorators: true`, `emitDecoratorMetadata: true`,
  `importHelpers: true` (with `tslib`).
- `incremental: true`, `outDir: ./dist`, `types: ["vitest/globals"]`.
- **No path aliases.** Every import is a relative path, and deep files carry
  long `../../../../` chains.

### Lint

**The scaffolding uses ESLint 9 flat config, not Biome.** `eslint.config.js`
extends `eslint.configs.recommended` and `tseslint.configs.recommended`, and
then sets the house style:

| Rule | Value |
|---|---|
| `quotes` | single |
| `max-len` | 90 columns (imports exempt) |
| indent | 2 spaces, `SwitchCase: 1` |
| `object-curly-spacing` | **never** — `{foo}`, not `{ foo }` |
| `comma-dangle` | never, everywhere |
| `arrow-parens` | as-needed |
| `padding-line-between-statements` | blank line before every `return` and every `if`, and after every `if` |
| `@typescript-eslint/consistent-type-imports` | `import type {...}` required |
| `explicit-function-return-type` | error (expressions allowed) |
| `explicit-member-accessibility` | warn — but the code always writes it |
| `prefer-readonly`, `no-floating-promises`, `no-unnecessary-type-assertion`, `no-shadow` | error |
| `prefer-enum-initializers` | error |
| unused vars | allowed with a leading `_` |

Semicolons are required (`@typescript-eslint/semi`).

### Other

- `.env` read once in `src/api/env/env.ts`, through `getEnv` (throws when
  missing) and `getOptionalEnv`. `NODE_ENV=test` loads `.env.test`.
  Variables are exported as a **nested typed object**, never read again from
  `process.env`.
- `.env.example` is committed; `.env` is ignored.
- HTTP examples live as Bruno `.bru` files in `rest-client/API/`.
- Branch naming from the README: `[task_id]-new_feature`. Commit messages:
  conventional-ish, `feat: …`, `refactor: …`.
- `src/types/global.d.ts` extends the Express `Request` for `currentSession`.

---

## 7. Gaps for this project

### A. What the scaffolding does that is WRONG here

1. **ESLint, not Biome.** The project brief fixes Biome for backend and
   frontend. The specs must port the *style decisions* (single quotes, no
   space inside braces, no trailing commas, 90 columns, 2-space indent,
   required semicolons, type-only imports, blank line before `return`/`if`)
   into `biome.json`, and drop `eslint.config.js` and the whole eslint
   dependency block. Note that Biome has **no equivalent** for
   `explicit-function-return-type`, `explicit-member-accessibility`,
   `no-floating-promises` or `prefer-readonly` (they need type information).
   The specs must say plainly whether those house rules survive as convention
   only, or whether `tsc --noEmit` plus review is the enforcement.
2. **Mongo and Mongoose are the whole persistence story.** `MongooseRepository`,
   `MongooseQueryBuilder`, `ObjectId` identifiers, the
   `Data`/`Document`/`Schema`/`Model` quartet, and even `IdValueObject` (it
   validates with `ObjectId.isValid`, while the error says "UUID") are all
   Mongo. This project has a **vector store in Docker**, not Mongo. The
   `IdValueObject` base must be rewritten around UUID, and the whole
   `cross-cutting/infrastructure/mongoose/` folder has no successor unless a
   document store is also chosen.
3. **`typedi` + `reflect-metadata` + decorators.** The container only needs
   `typedi` because of the decorator metadata; every binding is in fact written
   by hand with `new`. The specs can keep the exact same registrar structure and
   ordering and drop `typedi` for a plain `Map`, or keep `typedi`. Decide once.
   If `class-validator` is also dropped (see 4), `experimentalDecorators` can go
   and the project can be decorator-free.
4. **`class-validator` / `class-transformer` for input.** Both are decorator
   based and unmaintained-adjacent. The modern replacement is a schema library
   (Zod, Valibot). If the project swaps, then `BaseController.getBody/getQuery`,
   `BodyErrorsResponse.fromValidationError` and `BadRequestErrorHandler` all
   change shape. Decide this before writing any controller spec.
5. **Auth is the whole example.** Google SSO, JWT, login tokens, the
   `AuthenticatedUserMiddleware`, `currentSession` — none of it applies to a
   local single-user product. Copy the *shape* of the `user` context, not its
   content. The first bounded contexts here are something like
   `document` (ingestion) and `search` (retrieval).
6. **The API prefix and versioning are inconsistent** (`/api` in code,
   `/api/v1` in the README). Pick one in the spec.
7. **No build and no production start script.** `tsx watch` only. For a
   distributable local product the specs must add a build step (`tsc` or
   `tsup`) and a `start` script — the scaffolding has no precedent.
8. **`console.log` everywhere, no logger.** Several `// TODO: logger` comments.
   The specs should name a logging port if the ingestion pipeline needs progress
   reporting.
9. **Errors swallowed at the bus.** `EventEmitterDomainEventBus.publish` catches
   and drops rejections with a `// TODO`. Do not copy that.
10. **`isolate: false` in the Vitest pool** with a shared process is fine for
    pure domain tests. It is risky once tests load a model or hold a native
    handle. Revisit for this project.

### B. What this project needs and the scaffolding has NO answer for

1. **A long-running ingestion pipeline.** Everything here is request/response:
   a controller resolves one use case, awaits it, and answers. There is no job,
   no queue, no progress, no cancellation, no resumability, no back-pressure.
   The `ApplicationService<Req, Res>` base assumes one value out. Ingesting a
   folder of PDFs needs a different application-layer shape (a use case that
   emits progress, or a job aggregate with its own state). **Nothing in the
   repository shows how the owner writes that. This is the single biggest
   invention the specs must make, and it should be recorded as an ADR.**
2. **Binary and file-system input.** No multipart upload, no stream handling, no
   file path value object, no MIME sniffing, no size limit. `configureParsers`
   only registers `express.json()`. A `SourceFile` / `DocumentPath` value object
   and a file-reader port must be designed from scratch.
3. **A vector store adapter.** No precedent for a store whose query is a
   similarity search. `SearchCriteria` is built for cursor pagination over
   `_id` with exact-match filters; it cannot express "k nearest to this vector,
   filtered by metadata". Expect a new `SearchCriteria`-like type in
   `cross-cutting/domain/`, and a `VectorStore` port (or an
   `EmbeddingRepository`) in the search context. Also no answer for the Docker
   lifecycle of that store — the scaffolding assumes Mongo is already running
   and only `connectToMongoDb` exists.
4. **Local model loading (Transformers.js).** A model is an expensive,
   long-lived, warm-up-on-first-use singleton. The container registers eagerly
   constructed instances at boot, and its default scope is **transient**. There
   is no lazy provider and no async factory. The specs need a rule for this:
   likely an `Embedder` port in `domain/services/`, a
   `TransformersJsEmbedder` adapter registered as
   `DependencyScope.Singleton`, and an explicit decision about whether the
   model loads in `configureDatabase`-style bootstrap or lazily on first call.
   Also no precedent for a model cache directory or for offline behaviour.
5. **Chunking.** No precedent for a domain object that splits and re-joins text
   with offsets. It is pure domain and fits `core/<context>/domain/`, but the
   naming (`Chunk`, `ChunkId`, `Chunker` port) has to be invented.
6. **Retrieval as a port for the future agentic chat.** The scaffolding's
   equivalent to "retrieval must be a port" is `UserFinder` — a plain domain
   service in `domain/services/`. That is the pattern to copy: a
   `DocumentRetriever` (or similar) in `core/search/domain/services/`,
   consumed by the `SearchDocuments` use case, resolvable from the container so
   a later chat adapter can take the same dependency. The HTTP layer must never
   import it directly — the existing controllers respect this and the specs must
   keep it.
7. **A frontend.** The repository is backend only. There is no precedent for a
   monorepo, for how React + Vite sits next to `src/api`, or for a shared types
   package. The specs must decide the repository shape (two folders? workspaces?)
   with no guidance from the owner's reference.
8. **Streaming responses.** `BaseController` can only `json()` or `sendStatus()`.
   Progressive search results or a token stream for the future chat need an SSE
   or chunked-transfer sender that does not exist.
9. **Contract and end-to-end tests.** Only `test/unit` has a real file. There is
   no example of a test that drives the Express app, and no `supertest`. If the
   specs want HTTP-level tests, they define the pattern.
