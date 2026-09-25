---
kind: convention
status: accepted
---

# Convention: tests

- `<Subject>.test.ts`, under `test/unit/`, `test/integration/` or `test/e2e/`, at the path that mirrors `src/`.
- `describe('<Subject>')` holds one `describe` for each member: `'.of'` for a static, `'#run'` for an instance method. Each case is `it('should …')`.
- Test data comes from `<Type>Mother` in `test/utils/object-mother/` and `<Aggregate>Builder` in `test/utils/builders/<aggregate>/`. A builder has `a<Aggregate>()`, `with<Field>()` and `build()`, and `build()` calls `fromPrimitives()`.
