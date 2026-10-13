# Contributing

The rules that all the packages share. The README of each package tells how to
install it, start it and run its tests.

## Before you change the code

Read the conventions of the package that you change. They are in
[`docs/adr/`](adr/), in the files `*-convention-<package>-*`: one for each kind of
class or file, such as a use case, a controller, a component or a gateway. Use the
words of [`CONTEXT.md`](../CONTEXT.md) in the code, the interface and the
documentation.

When you take a decision of design, record it as a new ADR in `docs/adr/`.

## The house style

`biome.json` holds the style: single quotes, `{foo}` with no inner space, no trailing
comma, 90 columns, two spaces, semicolons, type-only imports, no `enum`, no barrel,
explicit accessibility and an explicit return type.

```sh
pnpm run format   # applies the style and writes the fixes
pnpm run lint     # checks the style
```

Some rules stay a convention, because Biome cannot see them:

- A folder is kebab-case. Biome reads the name of a file, never the name of a folder.
- A PascalCase file carries the name of the one thing it exports: a class, a registrar
  or a constant. Biome reads the case of the name, never the name itself.
- A blank line comes before a `return` and around an `if`. The formatter has no option
  for it.
- A field that is never written is `readonly`, a promise is never left floating, and a
  type assertion that changes nothing is removed. All three need the types, which Biome
  does not read.
- A use case, a controller and an event take the verb the glossary uses. A Resource is
  created, so the name is `Create`, never `Add`. A read model gives what it holds, so
  the name is `Get`, never `List`.

## What CI runs

CI runs `pnpm run lint:ci`, `pnpm run typecheck` and `pnpm run test:unit`. These need
no Docker and no model, so CI stays fast.

CI does not run the integration tests, the end-to-end tests or the evals. They need
Docker, and the evals also need the models, which CI never downloads. Run them on your
machine before you push a change that they cover.

## The rules of the tests

- A port is mocked with the helper `mock.ts` in the `test/utils/` folder of the
  package, and never with `vi.mock`. Everything else is real.
- A test never loads a model. What a model does is measured by an eval, which gives a
  score, not a pass or a fail.
- A change of model, of cutter or of a score of the Search carries its eval report in
  the same commit. The report is in `backend/evals/reports/`, and
  [`evals-glossary.md`](evals-glossary.md) explains how to read it.
- The tests mirror the code: a test of `src/a/B.ts` is in `test/<mode>/a/B.test.ts`,
  and an eval of it is in `test/eval/a/B.eval.ts`.
