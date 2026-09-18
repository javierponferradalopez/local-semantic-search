# The embedders load before the server listens

The three encoder towers — the Text model, and the text and vision towers of
the Vision model — load at start-up, and `main.ts` waits for them before the
HTTP server listens. The adapter **is** the loaded model: a private
constructor, an asynchronous static factory, and one live instance for the life
of the process. Of the four registrars the reference uses, only the
infrastructure one becomes asynchronous.

Decided in
[How the two models load and stay warm](https://github.com/javierponferradalopez/local-semantic-search/issues/15).

## Why not load on first use

[What happens when the user adds a file](https://github.com/javierponferradalopez/local-semantic-search/issues/10)
made the upload request **wait**, with no progress bar. A first upload that
also builds a session does not look slow, it looks broken.

The stronger reason is a boundary. That same ticket made a `Failed` `Resource`
the consequence of something found **in the file**. Weights that do not load
are not the fault of any file, so they must not produce a `Failed` `Resource`.
They must stop the process from starting.

And the standing constraint of the map asks that a future agent warms the same
models without HTTP. When warming is a step of the start-up, that process runs
the same two steps: wire the container, then serve.

## Why the factory is asynchronous

This is not a choice. `from_pretrained` returns `Promise<PreTrainedModel>`, and
every overload of `InferenceSession.create` in `onnxruntime-node` returns a
promise. There is no synchronous session build. The decision is only **who
waits** for it, and the answer is the factory, so that nothing in the container
is ever half-built.

A third place could wait: `await` at the top of a module, which would keep the
container synchronous. It is refused because loading would become an effect of
importing. It then fires inside tests even when the port is mocked, against the
rule of
[How the repository is laid out](https://github.com/javierponferradalopez/local-semantic-search/issues/12)
that **CI never downloads a model**.

## The application never downloads

`env.allowRemoteModels` is `false`, and `env.cacheDir` points at the model
store. Weights that are missing then fail immediately, instead of starting a
download of 43 to 63 seconds inside a request. The only place in the repository
where the network is allowed is the `models:fetch` script.

## Consequences

- **Start-up costs about two seconds**, `tsx watch` included, and about 3 GB
  stay resident even for a user who only adds PDFs. `multilingual-e5-small` at
  `fp32` was measured at **1601 MB**, five times its 470 MB file, and SigLIP2
  at `fp32` is 1129.5 MB of text tower plus 371.8 MB of vision tower.
- **The reference is diverged from, deliberately.** Its four registrars are
  synchronous and its container defaults to transient lifetime. The report on
  [The api-scaffolding structure](https://github.com/javierponferradalopez/local-semantic-search/issues/5)
  recorded that it has no answer for a warm-once model, and this is the answer.
- **The model store is not a cache.** Deleting it does not degrade the
  application, it stops it from starting until `pnpm models:fetch` runs again.
  The word "cache" belongs to the library and appears once, in the line that
  assigns `env.cacheDir`.
- **The port keeps two operations and gains nothing.** No `warmUp`, no
  `dispose`. Loading is how the adapter is born, so a mocked port never sees
  it.
