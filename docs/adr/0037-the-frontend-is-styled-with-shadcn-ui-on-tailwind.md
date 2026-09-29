---
kind: decision
status: accepted
---

# The frontend is styled with shadcn/ui on Tailwind

**The frontend uses Tailwind for its styles and shadcn/ui for its components.**
The theme is the neutral base of shadcn, with its light and its dark
variables. The dark variables apply when the system prefers a dark scheme.
There is no theme selector. The icons come from `lucide-react`.

Decided in
[One look, a search as you type, and an Ingest state that moves](https://github.com/javierponferradalopez/local-semantic-search/issues/70).

## Why

One global `index.css` of plain classes gave the page its look. It had no
colours, no theme and no dark mode, and each new screen added classes by hand.
Nothing made two screens look like one product.

shadcn/ui does not add a library of components to `node_modules`. Its CLI
copies the source of each component into `src/components/ui/`. So the code of
a component is ours: Biome lints it, and we change it when a rule needs it.

## The set-up

- Tailwind 4 runs as a Vite plugin (`@tailwindcss/vite`). There is no
  `tailwind.config`: the theme is in `src/index.css`.
- `components.json` holds the configuration of the CLI: the style
  `radix-vega`, the base colour `neutral` and the `@/` alias that
  `tsconfig.json` and `vite.config.ts` already had.
- The dark variables are in `@media (prefers-color-scheme: dark)`, not in a
  `.dark` class. The `dark:` variant of Tailwind follows the same media query,
  so a component and the variables always agree.
- A component imports `cn` from the package `cn`. There is no
  `src/lib/utils.ts`: the file that the CLI writes only exports `cn` again, and
  `noBarrelFile` refuses it.
- The Biome parser reads the directives of Tailwind (`css.parser.tailwindDirectives`).
- `src/index.css` holds all the variables of the neutral preset, also the
  `--sidebar-*` and `--chart-*` variables that no component uses yet. The file
  stays a copy of the preset, so a component that `shadcn add` writes finds its
  variables.

## Consequences

- **After each `shadcn add`, run `pnpm format`.** Then fix by hand what Biome
  still refuses, for example a function with no return type
  (`useExplicitType`) or a file that only exports again (`noBarrelFile`). An
  import of `@/lib/utils` becomes an import of `cn` from `'cn'`.
- **The old classes go one part at a time.** A part keeps its classes in
  `index.css` until the ticket that restyles it. So the page is never
  unstyled. The preflight of Tailwind removes the look that the browser gives
  to headings, buttons, links and inputs. Until its part is restyled, an old
  class can get that look back with a rule of its own in `index.css`.
- **A test never checks a class.** The look has no test. Check the theme, the
  classes and the dark mode in the running app.
