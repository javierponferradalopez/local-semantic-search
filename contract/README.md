# contract

The TypeScript types of the HTTP API: each request, each response, and the closed
sets of values that both sides use, such as the Content types, the Ingest states and
the Reasons. The backend, the frontend and the MCP server import them, so a change of
the API breaks the type check of each client that uses it.

The package is TypeScript source only. It has no dependency and no build step: each
file is imported directly, as `contract/<Name>`. Its only script is `typecheck`, which
`pnpm run typecheck` at the root runs. Its tests are in `backend/test/unit/contract/`.
