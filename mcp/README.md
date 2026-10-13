# mcp

An MCP server that lets an AI agent use your Resources. With it, an agent such as
Claude Code, Claude Desktop, Cursor or Gemini CLI can search your content and answer
from it: the server does the retrieval, and the agent writes the answer.

It is a client of the HTTP API of the [backend](../backend/README.md), and it speaks
only stdio: the agent client starts it as a child process. It opens no port, so your
content does not leave your machine.

Each run of the server is one Session, with the Origin `MCP`.

## The tools

All the tools are read-only. No tool creates, deletes or retries a Resource.

| Tool | What it gives |
|---|---|
| `search` | The Results of a Query in two groups. A Text Result has its name, Content type, the text of its Match, the page when there is one and a link to its File. A Picture Result has its name and a link to its File. |
| `get_matches` | More of one Text Resource for a Query: up to 10 Matches, best first, each with its text and its page when there is one. The Query can use other words than the Search. |
| `list_resources` | Each Resource with its name, Content type, Ingest state, creation date and a link to its File. A `Failed` Resource also has the code of its Reason. |

## Configuration

The server needs one variable, `BACKEND_URL`, the address of the backend. It reads
it from `mcp/.env`. `pnpm run bootstrap` copies `mcp/.env.example` to `mcp/.env`,
with the address of the local backend. The code has no default: if `BACKEND_URL` is
missing, the server does not start.

To use a backend on a different address, change `mcp/.env`, or set `BACKEND_URL` in
the `env` of the client configuration. A value that the client sets wins over
`mcp/.env`.

## Installation

From the root of the repository:

```sh
pnpm install
pnpm run bootstrap
```

The server runs with `tsx`, with no build step. A change in the code takes effect at
the next start.

## Start

You do not start the server yourself: the agent client starts it. Before you connect
a client:

1. Start the backend from the root of the repository with `pnpm dev`. It listens on
   `http://localhost:3001`.
2. Get the absolute path of this folder, for example
   `/Users/you/local-semantic-search/mcp`. The examples below write it as
   `/path/to/local-semantic-search/mcp`.

If the backend does not answer, the server continues to run, and each tool gives an
error that names `BACKEND_URL` and says to start the backend with `pnpm dev`. When
the backend is up, the next call works. You do not restart the client.

### Claude Code

```sh
claude mcp add local-semantic-search -- pnpm --dir /path/to/local-semantic-search/mcp start
```

### Claude Desktop

Add this to `claude_desktop_config.json`, then restart Claude Desktop:

```json
{
  "mcpServers": {
    "local-semantic-search": {
      "command": "pnpm",
      "args": ["--dir", "/path/to/local-semantic-search/mcp", "start"]
    }
  }
}
```

### Cursor

Add this to `~/.cursor/mcp.json`, or to `.cursor/mcp.json` in a project:

```json
{
  "mcpServers": {
    "local-semantic-search": {
      "command": "pnpm",
      "args": ["--dir", "/path/to/local-semantic-search/mcp", "start"]
    }
  }
}
```

### Gemini CLI

Add this to `~/.gemini/settings.json`, or to `.gemini/settings.json` in a project:

```json
{
  "mcpServers": {
    "local-semantic-search": {
      "command": "pnpm",
      "args": ["--dir", "/path/to/local-semantic-search/mcp", "start"]
    }
  }
}
```

## Test

| Command | What it covers | What it needs |
|---|---|---|
| `pnpm --filter mcp test:unit` | Each tool, called through an MCP client in memory, with fake gateways | Nothing |
| `pnpm --filter mcp test:integration` | Each HTTP adapter, against a fake backend on a local port | Nothing. No Docker. |

## Structure

```
src/main.ts       Reads the env, creates the server and connects it to stdio.
src/env.ts        Reads BACKEND_URL.
src/server/       Creates the MCP server and registers the tools.
src/tools/        One folder for each tool.
src/gateways/     The ports to the backend. http/ holds the adapters that use fetch.
test/unit/        The tests of the tools.
test/integration/ The tests of the HTTP adapters.
```

The conventions of this package are in [`docs/adr/`](../docs/adr/), in the files
`*-convention-mcp-*`. Read them before you change a tool or a gateway.
