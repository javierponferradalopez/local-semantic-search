# What the Langfuse SDK gives to count the cost of a local model

Research for [#127](https://github.com/javierponferradalopez/local-semantic-search/issues/127), part of the map [#126](https://github.com/javierponferradalopez/local-semantic-search/issues/126).
Date of the research: 2026-10-08.

Versions read:

- `@langfuse/tracing`, `@langfuse/otel`, `@langfuse/core`, `@langfuse/client`: **5.13.1** (the current major is v5). The unscoped `langfuse` package (3.39.2) is the legacy v3 SDK. Do not use it.
- `@opentelemetry/sdk-trace-base` and `@opentelemetry/sdk-trace` 2.12.0, `@opentelemetry/sdk-trace-node` 2.12.0.
- `emittery` 2.0.0 (from `backend/node_modules`).

This document gives facts. It does not decide the design. The trade-offs that a decision needs are in "Trade-offs for the decision".

## Answers

- **Observation types.** Use `embedding` for an embedding call (Chunks, Queries, Pictures). Only `generation` and `embedding` get cost. `LangfuseEmbeddingAttributes` is the same type as `LangfuseGenerationAttributes`: `model`, `modelParameters`, `usageDetails: Record<string, number>`, `costDetails: Record<string, number>`, `input`, `output`, `metadata`. No type `rerank` exists. A rerank call must be `generation` or `embedding` to get cost. A `span`, `retriever` or `tool` gets no cost.
- **Cost.** Langfuse Cloud calculates the cost at ingestion: `usageDetails[key] × price[key]` for each key, from a model definition whose regex `matchPattern` matches the `model` of the observation. The keys of `usageDetails` are free (any string). A price applies only when its key is the same as a usage key. So a rerank pair can be `{ pairs: n }` with a price for `pairs`, and a Picture can be `{ image: n }` with a price for `image`. Tokens of a local model are not inferred (the tokenizers are only for OpenAI and Claude): the code must send the count. A price change applies only to new observations, not to old ones. A `costDetails` that the code sends takes priority over the calculated cost.
- **sessionId.** `propagateAttributes({ sessionId }, fn)` puts `sessionId` on the active span and on all spans that start inside `fn`. The value must be a string of 200 characters or less (else the SDK drops it with a warning). The Ingest after the response: the emittery listener runs in the async context of the `emit` call, so it keeps the `sessionId` of the request, and its spans become children of the request span if one is active. To give the Ingest its own trace in the same Session, start its root span from `ROOT_CONTEXT` and call `propagateAttributes({ sessionId })` again, with the `sessionId` from the domain event or from the context.
- **Context.** The SDK keeps its context only through the OpenTelemetry Context API (`context.active()`, `context.with()`). It does not use `AsyncLocalStorage` itself. The process must register a context manager: `NodeTracerProvider.register()` or `NodeSDK.start()` registers `AsyncLocalStorageContextManager`. With no context manager, nesting and `propagateAttributes` do not work.
- **Flush, hot path, failure.** Default export is a `BatchSpanProcessor`: queue 2048 spans, batch 512 (`flushAt`), delay 5 s (`flushInterval`), timer `unref()`. A long-running server must call `await processor.shutdown()` (or `forceFlush()`) at stop: spans still in the buffer at exit are lost. On the hot path a call only creates an in-memory span and serializes its attributes; the HTTP export is in the background. When Langfuse Cloud does not answer: request timeout 5 s (`LANGFUSE_TIMEOUT`), up to 5 attempts with back-off on a retryable status inside that timeout, then the batch is lost and an error goes to the OpenTelemetry log. Nothing is thrown into our code. When the queue is full, new spans are dropped.
- **Regions and data.** EU `https://cloud.langfuse.com` (default, AWS eu-west-1), US `https://us.cloud.langfuse.com` (AWS us-west-2), JP `https://jp.cloud.langfuse.com`, HIPAA `https://hipaa.cloud.langfuse.com`. The regions are fully separate, and a project cannot move to an other region. The data that leaves is what the span holds: name, timestamps, `model`, `usageDetails`, `costDetails`, `input`, `output`, `metadata`, `sessionId`, the OTel resource attributes, and the public key in a header. `input` and `output` are optional. The SDK uploads each base64 data URI that it finds in them to object storage, unless `mediaUploadEnabled: false`.

## Details

### 1. Observation types and usage fields

`LangfuseObservationType` in `@langfuse/tracing` 5.13.1:
`"span" | "generation" | "event" | "embedding" | "agent" | "tool" | "chain" | "retriever" | "evaluator" | "guardrail"`.

The docs say: "Both are captured on observations of type `generation` and `embedding`" (usage and cost). The other types do not take `model`, `usageDetails` or `costDetails` in their attribute types.

Example from the docs, for an embedding:

```ts
const embedding = startObservation(
  "document-embedding",
  { input: [...], model: "text-embedding-ada-002" },
  { asType: "embedding" }
);
embedding.update({ usageDetails: { input: 150 } });
embedding.end();
```

Usage keys: "Usage types are mutually exclusive buckets: each token must be counted in exactly one key." If `total` is not set, Langfuse calculates it as the sum of all keys.

A rerank call has no type of its own. The docs give the `embedding` type as "a call to a LLM to generate embeddings" and `generation` as "generations of AI models". Neither name fits a reranker exactly. Both get cost in the same way.

### 2. How Langfuse calculates the cost

- Model definition (UI, or `POST /api/public/models`, type `CreateModelRequest` in `@langfuse/core`): `modelName`, `matchPattern` (regex on the `model` of the observation, for example `(?i)^multilingual-e5-small$`), `startDate` (applies only to observations after that date), `unit`, `pricingTiers`, `tokenizerId`, `tokenizerConfig`.
- `pricingTiers[].prices: Record<string, number>`: "Prices (USD) by usage type for this tier." Common keys: `input`, `output`, `total`, `request`, `image`. The price is in USD for each unit.
- Exactly one default tier: `isDefault: true`, `priority: 0`, `conditions: []`. Other tiers can have conditions on the sum of usage keys (`gt`, `gte`, `lt`, `lte`, `eq`, `neq`), or on a model parameter or a metadata value.
- `unit` takes `CHARACTERS | TOKENS | MILLISECONDS | SECONDS | IMAGES | REQUESTS`. This field is from the older flat prices. With `pricingTiers` the key of the price is what counts. (Uncertain: the role of `unit` when `pricingTiers` are set is not clear in the docs.)
- If more than one definition matches: a custom definition before a built-in one, then the newest one whose start date is before the start of the observation.
- Cost is calculated "at the time of ingestion if (1) usage is ingested or inferred, (2) and a matching model definition includes prices". "Updated defaults apply only to new generations."
- "When both are available, ingested values take priority over inferred ones." So a `costDetails` from the code replaces the calculated cost.
- The tokenizers (`o200k_base`, `cl100k_base`, `claude`) do not fit E5 or GTE. The code must send the token count. `@huggingface/transformers` gives the token count from the tokenizer of each model.
- The money of a local model has no bill. The price in the model definition is a reference price that a person sets. Who keeps it current is an open point of the map.

### 3. sessionId and the Ingest after the response

- v5 removed `updateActiveTrace()`. The trace attributes (`sessionId`, `userId`, `tags`, `metadata`, `traceName`, `version`) go through `propagateAttributes(params, fn)`.
- Source (`@langfuse/core` 5.13.1): `propagateAttributes` writes the value in the OTel context (`context.setValue`) and on the active span if it records. `LangfuseSpanProcessor.onStart` reads the value from the parent context and puts it on each new span. So only spans that start inside `fn` (and the active span) get it. Spans that started before do not get it.
- Rule of the value: a string, 200 characters or less. The docs say "US-ASCII". The source checks only the type and the length.
- `asBaggage: true` puts the value in W3C baggage too, so an OTel propagator can send it to an other service in HTTP headers. This repo does not need it inside one process.
- emittery 2.0.0, `emit()`: it awaits `resolvedPromise`, then calls each listener in `Promise.allSettled`. A Node async context (`AsyncLocalStorage`) follows `await`, so the listener runs with the context of the `emit` call. In this repo, `EmitteryEventBus.publish` calls `emit` from the use case of the upload. So the Ingest keeps the `sessionId` of the request, and also the active span of the request.
- Effect: the Ingest spans become children of the request trace, not a trace of their own, if a span of the request is active at `emit`. The span of the request can end before the children end. (Uncertain: how the Langfuse UI shows a child that ends after its parent; the pages read do not say.)
- To give the Ingest its own trace: run its root under `context.with(ROOT_CONTEXT, ...)` (from `@opentelemetry/api`), then call `propagateAttributes({ sessionId }, ...)` inside. `ROOT_CONTEXT` also removes the propagated `sessionId`, so the code must give it again. The domain event can carry it, or the adapter can read it before the switch.
- `startObservation(name, attrs, { parentSpanContext })` lets a span join a trace by a known `traceId` and `spanId`. This is the way to link across a gap with no shared async context.

### 4. Context: OpenTelemetry and AsyncLocalStorage

- `@langfuse/tracing` uses `context.active()`, `context.with()` and `trace.setSpan()` from `@opentelemetry/api`. No package of `@langfuse/*` 5.13.1 imports `AsyncLocalStorage` or `async_hooks`.
- `@opentelemetry/api` is a peer dependency (`^1.9.0`). `@langfuse/otel` has peer dependencies on `@opentelemetry/core`, `sdk-trace-base` (`^2.0.1`), `exporter-trace-otlp-http` and `otlp-exporter-base` (`>=0.202.0 <1.0.0`).
- The OTel default is a no-op context manager. `NodeTracerProvider.register()` (sdk-trace-node 2.12.0) creates an `AsyncLocalStorageContextManager` when the config gives none, and sets it as the global context manager. `NodeSDK.start()` does the same.
- `setLangfuseTracerProvider(provider)` gives Langfuse its own tracer provider, so its spans do not go to other OTel backends. The context manager stays global: the process still needs one.
- The default `shouldExportSpan` of v5 exports only spans of the Langfuse tracer, spans with `gen_ai.*` attributes, and spans of known LLM libraries. So an Express or HTTP auto-instrumentation does not go to Langfuse by default.

### 5. Flush, hot path, failure

From `LangfuseSpanProcessor` (`@langfuse/otel` 5.13.1) and `BatchSpanProcessorBase` (`@opentelemetry/sdk-trace` 2.12.0):

| Setting | Source | Default |
| --- | --- | --- |
| Export mode | `exportMode` | `BatchSpanProcessor`; `"immediate"` gives a `SimpleSpanProcessor` |
| Batch size | `flushAt` / `LANGFUSE_FLUSH_AT` | 512 |
| Delay | `flushInterval` (seconds) / `LANGFUSE_FLUSH_INTERVAL` | 5 s |
| Queue | `OTEL_BSP_MAX_QUEUE_SIZE` | 2048 spans, then "Dropped N spans because maxQueueSize reached" |
| Export timeout of a batch | `OTEL_BSP_EXPORT_TIMEOUT` | 30 s |
| HTTP timeout | `timeout` (seconds) / `LANGFUSE_TIMEOUT` | 5 s |
| Size of a batch | `LANGFUSE_OTEL_MAX_BATCH_SIZE_BYTES` | 64 MiB; a larger batch is dropped, not split |
| Compression | `compression` / `LANGFUSE_OTEL_COMPRESSION` | none |
| Endpoint | `baseUrl` / `LANGFUSE_BASE_URL` | `https://cloud.langfuse.com` + `/api/public/otel/v1/traces` |

- The batch timer calls `unref()`, so it does not keep the process alive.
- `forceFlush()` and `shutdown()` first wait for the spans in process (mask, media upload), then flush the batch. The README says: "Spans still buffered when the process exits are lost."
- Hot path: `startObservation` creates an OTel span in memory and serializes the attributes to JSON strings. `onEnd` does the mask and the media scan in a promise that it does not await. The HTTP export runs on the timer, outside the request. The cost grows with the size of `input` and `output`. A vector of 384 numbers in `output` is a large attribute.
- Failure (`otlp-exporter-base`, retrying transport): up to 5 attempts, back-off from 1 s ×1.5 to 5 s at most, ±20 % jitter, only for a "retryable" result, and only while the timeout permits. After that, the batch is lost and the error goes to the OTel `diag` log and `globalErrorHandler`. Our code gets no error.
- Langfuse Cloud limits (docs, "API limits"): ingestion 1,000 requests/min (Hobby), 4,000 (Core), 20,000 (Pro and higher); 5 MB for each request. (Uncertain: if the 5 MB limit applies to the OTel endpoint, a batch larger than 5 MB but smaller than the 64 MiB default of the SDK fails.)
- Billing (pricing page): each trace, observation and score is one billable unit. Hobby: 50k units/month, 30 days of data. Core: 100k units/month, 90 days. Each embedding call and each rerank call as its own observation adds one unit.

### 6. Regions and data that leaves the machine

| Region | Base URL | Location |
| --- | --- | --- |
| EU (default of the SDK) | `https://cloud.langfuse.com` | AWS eu-west-1, Ireland |
| US | `https://us.cloud.langfuse.com` | AWS us-west-2, Oregon |
| Japan | `https://jp.cloud.langfuse.com` | AWS ap-northeast-1, Tokyo |
| HIPAA | `https://hipaa.cloud.langfuse.com` | AWS us-west-2, Oregon |

- "All data, user accounts, and infrastructure are completely separated between the regions." "Switching regions requires creating a new account and migrating your data." Langfuse Cloud runs on AWS, with ClickHouse Cloud for analytics.
- What leaves: each exported span with its name, start and end time, observation type, `model`, `modelParameters`, `usageDetails`, `costDetails`, `input`, `output`, `metadata`, `sessionId`, `userId`, `tags`, environment, release, and the OTel resource attributes. The request headers hold `Authorization: Basic` (public and secret key) and the public key.
- `input`, `output` and `metadata` are optional. If they are not set, no Query text, Chunk text or Picture leaves. A `mask` function can change them before export.
- Media: the processor looks for base64 data URIs (`data:...;base64,...`) in the attributes and uploads them to object storage of Langfuse (S3). `mediaUploadEnabled: false` or `LANGFUSE_MEDIA_UPLOAD_ENABLED=false` stops it. So a Picture sent as a data URI in `input` leaves the machine as a file.
- Resource attributes: `NodeSDK` adds host, OS and process detectors by default (they can hold the host name and the command line). `NodeTracerProvider` with no detectors gives only `service.name` and the SDK attributes. (Uncertain: how Langfuse shows the resource attributes; it is not in the pages read.)

## Trade-offs for the decision

- **Type of a rerank call.** `generation` or `embedding` gets cost. `span` or `retriever` gets none. A rerank as `embedding` mislabels it; a rerank as `generation` has an empty `output` that Langfuse expects to be a completion.
- **Usage key of a rerank and a Picture.** `pairs` and `image` (or `request`) are free names. Tokens of a rerank pair are also possible (the reranker tokenizer counts Query plus Chunk). The model definition must use the same key.
- **One observation for each call or for each batch.** One for each model call is the most precise, but each is a billable unit, and an Ingest of a large PDF makes many units. One for each batch of Chunks gives the same usage sum with fewer units.
- **Price in Langfuse or cost in the code.** A model definition keeps the price out of the domain (the map wants this). `costDetails` from the code takes priority, but puts a price in the code.
- **The Ingest trace.** As a child of the upload trace it needs no extra code, but the trace mixes the upload and the Ingest. As its own trace it needs `ROOT_CONTEXT` and a second `propagateAttributes`, and the `sessionId` must reach the handler (in the domain event or in the context).
- **Where the `sessionId` comes from.** The SDK needs it in the OTel context, set by the adapter around the request. The port of our own can take the `sessionId` as an argument and keep OTel inside the adapter, or the adapter can read it from the context.
- **Batch or immediate export.** Batch is the default for a server and keeps the hot path short; it loses up to 5 s of spans at a crash. Immediate sends one HTTP request for each span.
- **Data that leaves.** No `input` and `output` sends only units. With them, the Query text and Chunk text leave, and Pictures leave as files unless media upload is off.
- **Region.** EU is the SDK default. A project cannot move later.

## Sources

- Observation types: https://langfuse.com/docs/observability/features/observation-types
- Token and cost tracking: https://langfuse.com/docs/observability/features/token-and-cost-tracking
- Sessions: https://langfuse.com/docs/observability/features/sessions
- TS SDK setup: https://langfuse.com/docs/observability/sdk/typescript/setup
- TS SDK advanced usage: https://langfuse.com/docs/observability/sdk/typescript/advanced-usage
- Upgrade v4 to v5: https://langfuse.com/docs/observability/sdk/upgrade-path/js-v4-to-v5
- Multi-modality and media: https://langfuse.com/docs/observability/features/multi-modality
- Data regions: https://langfuse.com/security/data-regions
- API limits: https://langfuse.com/faq/all/api-limits
- Pricing: https://langfuse.com/pricing
- Public API (models): https://api.reference.langfuse.com/ (type `CreateModelRequest` in `@langfuse/core` 5.13.1 `dist/index.d.ts`)
- SDK source: https://github.com/langfuse/langfuse-js (read from npm tarballs `@langfuse/tracing`, `@langfuse/otel`, `@langfuse/core` 5.13.1)
- OTel batch processor: https://github.com/open-telemetry/opentelemetry-js/tree/main/packages (`@opentelemetry/sdk-trace` 2.12.0, `export/BatchSpanProcessorBase.js`)
- OTel retrying transport: https://github.com/open-telemetry/opentelemetry-js/blob/main/experimental/packages/otlp-exporter-base/src/retrying-transport.ts
- OTel Node tracer provider: `@opentelemetry/sdk-trace-node` 2.12.0, `build/src/NodeTracerProvider.js`
- emittery 2.0.0: `backend/node_modules/emittery/index.js`, `emit()`
