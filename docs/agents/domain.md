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

Each rule of this repo is an ADR in `docs/adr/`, of one of two kinds: a **decision** or a **convention**. The frontmatter of the ADR gives its kind and its status:

```md
---
kind: decision | convention
status: accepted | superseded by ADR-NNNN
---
```

A convention is the shape of the code: names, suffixes, folders, factories, the shape of a test. Its file is `NNNN-convention-<package>-<topic>.md`. The topic is the kind of class or file that it governs, and one package and topic have one `accepted` ADR.

The packages:

- `backend` — `backend/`
- `frontend` — `frontend/`

### Before you write code

Read the `accepted` convention of each kind of class or file that you add or change: `ls docs/adr/*-convention-<package>-*` lists them. A convention is complete in itself: to follow it, you need no other ADR.

### Code that follows a superseded convention

It stays valid, and the superseded ADR explains it. When you change such a file for another reason, move it to the `accepted` convention.
