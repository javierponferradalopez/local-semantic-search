# Grouping by Resource happens in SQL

A search returns one row per Resource, ranked by its best Chunk, and the screen
shows a fixed number of rows. The vector query therefore **groups in the adapter**
— `DISTINCT ON (resource_id)` ordered by distance — instead of returning flat
Matches for the use case to group in memory.

This **revises the location** of a decision taken in
[The words this project uses](https://github.com/javierponferradalopez/local-semantic-search/issues/9),
which put the grouping in the `Search` use case. That shape cannot honour a limit
on rows: the port limits Matches, so "fifty rows" really means "between one and
fifty rows", and one long PDF can supply every Match and leave a single row. The
alternative — over-fetch Matches and trim the grouped Results — spends an
unbounded guess to hide the same problem.

Decided in
[What the user gets back from a search](https://github.com/javierponferradalopez/local-semantic-search/issues/11).

## Consequences

- **The grouping is still not in the HTTP layer**, which is what #6 and #9 actually
  protect. It moves from the use case to the driven adapter. A query port is still
  not a repository: it returns the shape the screen needs, not aggregates.
- **The scan cost is unchanged.**
  [ADR-0001](./0001-postgres-with-pgvector-as-the-single-store.md) chose exact search
  with no HNSW index, so every query already walks the whole table. `DISTINCT ON` adds
  a sort over rows that are already being read.
- **The rest of a Resource's Matches need a second query**, scoped to one Resource.
  This is the port method behind the "More in this file" link. The first query no
  longer carries them.
- **When an HNSW index arrives, this needs rethinking.** An approximate index returns
  the top Matches, and grouping those cannot guarantee a fixed number of Resources.
  The index decision and this one are coupled.
