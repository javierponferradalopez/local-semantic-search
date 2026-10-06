# mcp

An MCP server that lets an AI agent use your Resources. It is a client of the HTTP
API of the backend, and it speaks only stdio: the agent client starts it as a child
process. It opens no port, so your content does not leave your machine.

## The tools

All the tools are read-only. No tool creates, deletes or retries a Resource.

| Tool | What it gives |
|---|---|
| `search` | The Results of a Query in two groups. A Text Result has its name, Content type, the text of its Match, the page when there is one and a link to its File. A Picture Result has its name and a link to its File. |
| `get_matches` | More of one Text Resource for a Query: up to 10 Matches, best first, each with its text and its page when there is one. The Query can use other words than the Search. |
| `list_resources` | Each Resource with its name, Content type, Ingest state, creation date and a link to its File. A `Failed` Resource also has the code of its Reason. |

## Before you connect a client

1. Start the backend from the root of the repository with `pnpm dev`. It listens on
   `http://localhost:3000`.
2. Get the absolute path of this folder, for example
   `/Users/you/local-semantic-search/mcp`. The examples below write it as
   `/path/to/local-semantic-search/mcp`.

The server needs one variable, `BACKEND_URL`, the address of the backend. It reads
it from `mcp/.env`. `pnpm run bootstrap` copies `mcp/.env.example` to `mcp/.env`,
with the address of the local backend. The code has no default: if `BACKEND_URL` is
missing, the server does not start.

To use a backend on a different address, change `mcp/.env`, or set `BACKEND_URL` in
the `env` of the client configuration. A value that the client sets wins over
`mcp/.env`.

The server runs with `tsx`, with no build step. A change in the code takes effect at
the next start.

If the backend does not answer, the server continues to run, and each tool gives an
error that names `BACKEND_URL` and says to start the backend with `pnpm dev`. When
the backend is up, the next call works. You do not restart the client.

## Claude Code

```sh
claude mcp add local-semantic-search -- pnpm --dir /path/to/local-semantic-search/mcp start
```

## Claude Desktop

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

## Cursor

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

## Gemini CLI

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

## The tests

- `pnpm test:unit` calls each tool through an MCP client in memory, with false
  gateways.
- `pnpm test:integration` checks each HTTP adapter against a false backend on a local
  port. It needs no Docker.
