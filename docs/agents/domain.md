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

## Decision or convention

Each rule of the project lives in one ADR. An ADR is one of two kinds. Its frontmatter gives the kind and the status:

```md
---
kind: decision | convention
status: accepted | superseded by ADR-NNNN
---
```

### Which kind

Ask one question: **can a find-and-replace or a codemod revert the rule, with no change to what the system does?**

- **Yes → convention.** Names, suffixes, the factories of a value object, the base class of an aggregate, folders, the shape of a test.
- **No → decision.** To revert it changes the behaviour, the stored data, a contract with the outside, or the flow between modules. Examples: when the bus publishes, what a handler does with a `throw`, how a deletion reaches another module.

Two checks support the answer:

- **No real alternative was refused** → convention.
- **A reader would "fix" it** → decision, even when it is small.

One topic can have a part of each kind. For a handler, the errors it catches are a decision, and its name and its folder are a convention.

### A decision

- Its file is `NNNN-<the-decision-as-a-sentence>.md`.
- It obeys the three conditions of the ADR format: hard to reverse, surprising without context, the result of a real trade-off.
- To change it, a new decision amends it. The new ADR states only the change, and the old one gets an **Amended by** note at its top.
- It can link to the convention that applies it.

### A convention

- Its file is `NNNN-convention-<package>-<topic>.md`: `0033-convention-backend-handler.md`. The package is `backend` or `frontend`. The topic is the kind of class or file that the agent writes, and one package and topic have one `accepted` ADR.
- It holds the rule and its example. It gives a why only when a real one exists.
- It is complete in itself and links to no decision, so the agent that writes the code reads the convention and nothing more.
- To change it, write a new ADR with the same package and topic that restates the whole convention, and set the old one to `superseded by ADR-NNNN`.
- The code that follows a superseded convention stays valid, and the superseded ADR explains it. When you change such a file for another reason, move it to the accepted convention.
