---
kind: convention
status: accepted
---

# Convention: gateways

- A gateway is a port, an `interface` `<Context>Gateway` in `src/gateways/`. There is one for each context of the backend with an HTTP edge: `SearchGateway`, `ResourceGateway`. A new call goes into the gateway of the context that owns its route.
- A port declares only what a tool calls. A method drops the noun that the port already says, and never cuts a compound term in half: `ResourceGateway.list()`, `SearchGateway.matches(resourceId, query)`.
- A method returns the types of `contract`, with no mapping: `SearchResponse`, `GetMatchesResponse`, `GetResourcesResponse`. A URL stays as the API gives it. The one exception is a binary, which `contract` has no type for: a method that downloads one gives its bytes and its media type.
- An adapter is `Http<Port>`, in `src/gateways/http/`: `HttpSearchGateway`. Its constructor takes one object argument with the address of the backend.
- A failure has two classes in `src/gateways/`, and they hold nothing of HTTP. `Refusal` holds the `ErrorItem[]` of an `ApiError`. `BackendUnavailable` holds the address that did not answer.
- `fetchOrRefuse` in `src/gateways/http/` is the only place that makes a failure: a fetch that throws becomes `BackendUnavailable`, and a response that is not ok becomes `Refusal`. `fetchJson` does the same for a response with a body. The adapters share these collaborators, not a parent class.
- Nothing under `src/gateways/` imports the MCP SDK. Nothing outside `src/gateways/http/` calls `fetch`.
- `createServer` takes the gateways in one object, `{search: SearchGateway, resources: ResourceGateway}`, and `backendUrl`. Only `src/main.ts` builds an adapter.
- An adapter is tested in `integration`, against a `node:http` server that answers as the backend. The test checks the URL and the query string, the types of `contract`, the bytes and the media type of a download, a `Refusal` and `BackendUnavailable`.
