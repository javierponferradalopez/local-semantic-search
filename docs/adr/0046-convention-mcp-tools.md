---
kind: convention
status: accepted
---

# Convention: tools

- A tool is a folder `src/tools/<tool-name>/`, in kebab-case: `get-matches/`. It holds `register<Name>Tool.ts` and `present<Name>.ts`, in the PascalCase of the tool name: `registerGetMatchesTool`, `presentGetMatches`.
- `register<Name>Tool(server, {gateways, backendUrl})` calls `server.registerTool()` with the name, the title, the description, the Zod `inputSchema` and `annotations: {readOnlyHint: true}`. `createServer` calls each one, and gives it the gateways and the address of the backend.
- A tool is a thin entry. The SDK validates the input with the schema of the tool before the handler runs. The handler calls a gateway and gives the result to the presentation.
- A tool knows nothing of HTTP and nothing of the transport. It gets `McpServer` and gateways, never `fetch`, a status or a transport. Nothing writes to stdout.
- The presentation is a function with no I/O. The tool gives it the result and `backendUrl`. It turns the types of `contract` into the MCP content, and it resolves each URL with `new URL(url, backendUrl)`, never with a prefix. It gives no score.
- The name of a tool is snake_case and starts with a verb: `search`, `get_matches`, `list_resources`. Its noun is a word of the glossary. The agent reads the name, so the verbs are the ones that agents know from other MCP servers, and the rule "Get, never List" of the code does not apply.
- The title is the name in words for a person: `Read more of a Resource`.
- The description is English for an agent that has not read `CONTEXT.md`. It says what the tool gives, when to call it, and which tool to call next, by its name. It does not name the `Floor`, the `Margin`, the Reranker or a score. Each field of the schema has `.describe()`.
- A tool that reads content follows two more rules:
  - An empty answer tells the agent what to do next, for example to try other words or another language. An empty answer is not `isError`.
  - The description says that a `Result` or a `Match` can be on a near subject and not answer the question, so the agent reads the text and ignores it.
- `isError: true` is only for a failure. One shared function, `presentFailure` in `src/tools/`, makes its text. A tool catches `Refusal` and `BackendUnavailable` only, and gives them to it:
  - `BackendUnavailable` names the address in `BACKEND_URL` and says to start the backend with `pnpm dev`.
  - `Refusal` gives each code of its `ErrorItem[]` with its params, for example `resource_not_found`. It adds no sentence for each code: the agent turns the code into words.
  - Each other error is a fault. The tool does not catch it.
- A tool is tested in `unit`, through a `Client` of the SDK on an `InMemoryTransport`, with false gateways. The test calls the tool by its name and asserts the content, `isError` and the texts that the agent receives.
