---
kind: convention
status: accepted
---

# Convention: files and folders

- One exported class, or one exported object, in each file. The file has its name, in PascalCase. Folders are kebab-case. Import each file by its relative path.
- A module is `core/<module>/` with `domain/`, `use-cases/` and `infrastructure/`. `domain/` holds `errors/`, `events/`, `services/` and `value-objects/`. `infrastructure/` holds one folder for each technology: `drizzle/`, `transformers/`.
- `core/shared/` has the folders of a module, except `use-cases/`.
