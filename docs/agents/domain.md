# Domain Docs

How the engineering skills should consume this repo's domain documentation when exploring the codebase.

## Before exploring, read these

- **`CONTEXT.md`** at the repo root, or
- **`CONTEXT-MAP.md`** at the repo root if it exists — it points at one `CONTEXT.md` per context. Read each one relevant to the topic.
- **`docs/adr/`** — read ADRs that touch the area you're about to work in. In multi-context repos, also check `src/<context>/docs/adr/` for context-scoped decisions.

If any of these files don't exist, **proceed silently**. Don't flag their absence; don't suggest creating them upfront. The producer skill (`/grill-with-docs`) creates them lazily when terms or decisions actually get resolved.

## File structure

Single-context repo (most repos):

```
/
├── CONTEXT.md
├── docs/adr/
│   ├── 0001-event-sourced-orders.md
│   └── 0002-postgres-for-write-model.md
└── src/
```

Multi-context repo (presence of `CONTEXT-MAP.md` at the root):

```
/
├── CONTEXT-MAP.md
├── docs/adr/                          ← system-wide decisions
└── src/
    ├── ordering/
    │   ├── CONTEXT.md
    │   └── docs/adr/                  ← context-specific decisions
    └── billing/
        ├── CONTEXT.md
        └── docs/adr/
```

## Use the glossary's vocabulary

When your output names a domain concept (in an issue title, a refactor proposal, a hypothesis, a test name), use the term as defined in `CONTEXT.md`. Don't drift to synonyms the glossary explicitly avoids.

If the concept you need isn't in the glossary yet, that's a signal — either you're inventing language the project doesn't use (reconsider) or there's a real gap (note it for `/grill-with-docs`).

## Flag ADR conflicts

If your output contradicts an existing ADR, surface it explicitly rather than silently overriding:

> _Contradicts ADR-0007 (event-sourced orders) — but worth reopening because…_

## ADR or convention

Each rule has one home: an ADR or the conventions document (`docs/conventions.md`). To choose, ask one question:

**Can a find-and-replace or a codemod revert it, with no change to what the system does?**

- **Yes → convention.** Names, suffixes, the factories of a value object, the base class of an aggregate, folders, the shape of a test.
- **No → ADR.** To revert it changes the behaviour, the stored data, a contract with the outside, or the flow between modules. Examples: when the bus publishes, what a handler does with a `throw`, how a deletion reaches another module.

Two checks support the answer:

- **No real alternative was refused** → it is a convention. An ADR records a trade-off, and without one there is nothing to record.
- **A reader would "fix" it** → it needs an ADR to protect it, even when it is small.

One topic can have a part of each kind. For a handler, the errors it catches are in an ADR, and its folder and its one use case are a convention.

### The link points from the why to the how

A convention is complete in itself. It states the rule and its example, and it **never links to an ADR**: a link makes an agent read an ADR that the code it writes does not need, and the conventions stop being read on demand. An ADR can link to the convention that applies it.
