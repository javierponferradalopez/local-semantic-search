# Does the async context cross the bus and the Ingest after the response?

Research for [#128](https://github.com/javierponferradalopez/local-semantic-search/issues/128), part of the map [#126](https://github.com/javierponferradalopez/local-semantic-search/issues/126). Node 24.11.0, Express 5.2.1, multer 2.4.0, emittery 2.0.0.

## Answers

- **Across an `emit` of emittery 2.0.0, to each listener: yes.** Each listener runs in the context of the call to `emit()`, not of the call to `on()`. All listeners of one event get the same context, and the context stays after each `await` in a listener. `emitSerial()` also keeps it.
- **Into the Ingest after the Express 5 response: yes.** The use case calls `void this.eventBus.publish(...)` in the request, before `response.json()`. The Ingest listener starts in that context and keeps it after the `201`, through each `await` (disk, model, repository), into the `…Ingested` event that it publishes, and into `MarkTextResourceAsReady`. Two uploads at the same time keep two different contexts. multer does not break it: multer 2.4.0 binds its `next()` with an `AsyncResource` on purpose.
- **Beside the `AsyncLocalStorage` of `DrizzleConnection`: yes, with no conflict.** Two instances are two keys. Each `run()` sets only its own key. One condition: publish after `run()` ends, as the use cases do now. A publish inside `run()` gives the open transaction to all listeners (case L5 below).

## How to run the proof

```sh
cd backend && pnpm exec tsx ../research/async-context.ts
```

The script [`async-context.ts`](async-context.ts) uses the real code of the upload path: Express 5, the real middlewares (`refuseAFileTooLarge`, `takeTheFiles` with multer, `takeOneFile`), `CreateTextResourceController`, `CreateTextResource`, `EmitteryEventBus`, `DrizzleConnection`, `IngestTextResourceOnTextResourceCreatedOrRetried`, `CodePointCutter`, `ContentTypeTextExtractor` and `MarkTextResourceAsReadyOnTextResourceIngested`. Only the edge is fake: the repositories, the `FileStore`, the `TextEmbedder` (it waits 30 ms, as a slow model) and the root database of `DrizzleConnection` (its `transaction()` gives a marker). A middleware opens `requestContext.run({requestId}, next)` before the routes. Each line prints the request id that `getStore()` gives (`LOST` when it gives nothing) and if `DrizzleConnection.database()` gives an open transaction.

Part A sends two uploads at the same time: `req-1` with 4 MB (the body arrives in many chunks) and `req-2` with 16 bytes. Part B tests the edge cases.

## Output

```text
node v24.11.0
A1a before multer                              request=req-1 transaction=none
A1a before multer                              request=req-2 transaction=none
A1b after multer                               request=req-2 transaction=none
A2 land: repository, in the transaction        request=req-2 transaction=open
A3 second listener of …Created                 request=req-2 transaction=none
A4 Ingest: fileStore.read                      request=req-2 transaction=none
A1c controller: after response.json (201)      request=req-2 transaction=none
A0 response 'finish' listener                  request=req-2 transaction=none
-- client got 201 for req-2                    request=LOST  transaction=none
A1b after multer                               request=req-1 transaction=none
A2 land: repository, in the transaction        request=req-1 transaction=open
A3 second listener of …Created                 request=req-1 transaction=none
A4 Ingest: fileStore.read                      request=req-1 transaction=none
A1c controller: after response.json (201)      request=req-1 transaction=none
A0 response 'finish' listener                  request=req-1 transaction=none
-- client got 201 for req-1                    request=LOST  transaction=none
A5 Ingest: textEmbedder.embedChunk (+30 ms)    request=req-2 transaction=none
A6 repository.find (Ingest, then MarkAsReady)  request=req-2 transaction=none
A6 repository.find (Ingest, then MarkAsReady)  request=req-2 transaction=open
A7 MarkAsReady: repository.update              request=req-2 transaction=open
A5 Ingest: textEmbedder.embedChunk (+30 ms)    request=req-1 transaction=none
A6 repository.find (Ingest, then MarkAsReady)  request=req-1 transaction=none
A6 repository.find (Ingest, then MarkAsReady)  request=req-1 transaction=open
A7 MarkAsReady: repository.update              request=req-1 transaction=open

B1 on() at boot, emit() in req-B1              request=reqB1 transaction=none
B2 emitSerial, listener after an await         request=reqB2 transaction=none
B3 queueMicrotask                              request=reqB3 transaction=none
B3 process.nextTick                            request=reqB3 transaction=none
B3 setImmediate                                request=reqB3 transaction=none
B3 setTimeout                                  request=reqB3 transaction=none
B4 events() iterator, loop started at boot     request=LOST  transaction=none
B5 work queue, worker loop started at boot     request=LOST  transaction=none
B5b work queue, job bound with bind()          request=reqB5b transaction=none
B6 EventEmitter.on in request, emit at boot    request=LOST  transaction=none
B7 worker 'message' callback (inside: undefined) request=reqB7 transaction=none
B8 listener of a publish made in run()         request=reqB8 transaction=open
```

Read Part A by request id. For each request, the lines after `client got 201` (A5, A6, A7) still give the correct id: the Ingest runs after the response and keeps the context. `req-1` and `req-2` interleave, and no line gives the id of the other request. `transaction=open` shows only inside `run()` (A2, and the A6/A7 of `MarkAsReady`). The listeners of the bus (A3, A4) give `transaction=none`, because the use case publishes after the commit. The `client got 201` lines give `LOST` because the client code runs outside each request: this is correct.

## The mechanism

Node 24 implements `AsyncLocalStorage` with `AsyncContextFrame` by default. The current context is a frame. A promise reaction (`then`, `await`), a timer, `setImmediate`, `queueMicrotask` and `process.nextTick` capture the frame at the time the code schedules them, and restore it when they run. An `EventEmitter` does not capture: its listeners run in the frame of the code that calls `emit()`.

emittery 2.0.0 (`backend/node_modules/emittery/index.js`, `emit()` near line 740):

```js
async emit(eventName, eventData) {
  // ...
  const staticListeners = [...listeners];
  await resolvedPromise;
  const results = await Promise.allSettled([
    ...staticListeners.map(async listener => {
      if (listeners.has(listener)) {
        return listener(makeEventObject(eventName, eventData, hasEventData));
      }
    }),
    // ... the same for onAny listeners
  ]);
```

`emit()` is an `async` function, so its body runs in the frame of the caller. After `await resolvedPromise`, the continuation gets the same frame back. Each listener is then called from that continuation. emittery keeps no reference to the frame of `on()`. So the context of a listener is the context of `emit()`. `emitSerial()` is the same, with a `for` loop of `await listener(...)` in place of `Promise.allSettled`.

`EmitteryEventBus.publish()` calls `emitter.emit()` synchronously, inside the frame of the use case. `CreateTextResource.run()` calls `publish()` after `await this.transactionRunner.run(...)` ends, so the frame has the request context and has no transaction. `void` does not change the frame: the promise chain lives on after the response, with its frame.

`DrizzleConnection` has its own `AsyncLocalStorage<DrizzleDatabase>`. In a frame, each instance is a different key. `openTransaction.run(transaction, work)` makes a new frame that copies all keys and changes only its own key. So the request context goes into a transaction, and is the same when the transaction ends.

multer 2.4.0 (`backend/node_modules/multer/lib/make-middleware.js`, line 65) makes an `AsyncResource` when the middleware starts, and calls `next()` with `resource.runInAsyncScope(...)`. Without this, `next()` would run from a busboy stream event, in the frame of the HTTP parser, and the context would be lost for the rest of the chain.

## Cases where the context is lost or is wrong

The proof shows L1 to L5. The others come from the same mechanism.

- **L1. A consumer of `emitter.events()` or `anyEvent()` (B4).** The `for await` loop starts in its own frame (at boot) and every turn resumes there. The bus does not use the iterator now. Use `on()`.
- **L2. A work queue whose worker loop starts at boot (B5).** The request only pushes a job, and the job runs in the frame of the loop. To keep the context, bind the job when the request pushes it: `AsyncLocalStorage.bind(job)` or `AsyncResource.bind(job)` (B5b). Also a pool of model sessions or a semaphore with a waiting list.
- **L3. An `EventEmitter` that another context emits (B6).** A listener that the request adds to a long-lived emitter (a socket, a pg `Pool`, a stream, a `process` event) runs in the frame of the emit. This is the loss that multer prevents. A promise (`await once(emitter, 'x')`) does not lose it, because the `await` restores the frame.
- **L4. A worker thread (B7).** The worker is a different isolate. It has no copy of the store, so the context does not go into it. On the main thread, the `'message'` callback keeps the context of the code that made the `Worker`. To carry the context, send the values in the message.
- **L5. A publish inside `DrizzleConnection.run()` (B8).** It is not a loss but a leak: the listeners get the transaction of the publisher, which is already committed when they run. A listener that calls `database()` then uses a closed transaction. The use cases publish after `run()` ends (ADR-0017). Keep this rule.
- **L6. A callback API that queues the callback and calls it from another frame.** For example a callback given to a pool that is full: the callback runs in the frame of the code that releases a client. With `await`, the frame comes back. drizzle and pg use promises, so this does not apply now.
- **L7. `@huggingface/transformers` and `onnxruntime-node`.** The embedders `await` the model. The native work runs on its own threads and gives no JavaScript callback, and the `await` gives back the frame of the caller. The context stays (in the proof, the fake embedder does the same `await`). A model that loads at boot (ADR-0008) and is used later does not change this: what counts is the frame of the caller, not of the load.
- **L8. Code that does not run under the request.** A timer or an interval started at boot, a cron, a sweep, or code started from the `'listening'` callback: it has no request context, because no request started it. A cron that cures the rows stuck in `Ingesting` (ADR-0018) gets no Session.
- **L9. `enterWith()` in place of `run()`.** `enterWith()` changes the frame of the current synchronous run and of all that it schedules, also after the middleware returns. In a middleware, use `run(store, next)`.

Not a loss: `setTimeout`, `setImmediate`, `queueMicrotask` and `process.nextTick` that the request schedules (B3); `emitSerial()` (B2); a listener added with `on()` at boot (B1); the `'finish'` listener of the Express response (A0).
