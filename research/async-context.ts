// Proof for issue #128: does an AsyncLocalStorage context that a request opens reach
// the listeners of the bus and the Ingest after the response?
// Run: cd backend && pnpm exec tsx ../research/async-context.ts
import {AsyncLocalStorage} from 'node:async_hooks';
import {EventEmitter} from 'node:events';
import {createRequire} from 'node:module';
import type {AddressInfo} from 'node:net';
import {Worker} from 'node:worker_threads';
import type {NodePgDatabase} from 'drizzle-orm/node-postgres';
import type {Request, Response} from 'express';
import {CreateTextResourceController} from '../backend/src/api/controllers/resources/CreateTextResourceController';
import {refuseAFileTooLarge} from '../backend/src/api/middlewares/refuseAFileTooLarge';
import {takeOneFile} from '../backend/src/api/middlewares/takeOneFile';
import {takeTheFiles} from '../backend/src/api/middlewares/takeTheFiles';
import type {ChunkRepository} from '../backend/src/core/ingestion/domain/ChunkRepository';
import {CodePointCutter} from '../backend/src/core/ingestion/infrastructure/CodePointCutter';
import {ContentTypeTextExtractor} from '../backend/src/core/ingestion/infrastructure/ContentTypeTextExtractor';
import {IngestTextResourceOnTextResourceCreatedOrRetried} from '../backend/src/core/ingestion/use-cases/IngestTextResourceOnTextResourceCreatedOrRetried';
import type {ResourceRepository} from '../backend/src/core/resources/domain/ResourceRepository';
import {ExtensionContentTypeResolver} from '../backend/src/core/resources/infrastructure/ExtensionContentTypeResolver';
import {CreateTextResource} from '../backend/src/core/resources/use-cases/CreateTextResource';
import {MarkTextResourceAsReadyOnTextResourceIngested} from '../backend/src/core/resources/use-cases/MarkTextResourceAsReadyOnTextResourceIngested';
import type {FileStore} from '../backend/src/core/shared/domain/services/FileStore';
import type {TextEmbedder} from '../backend/src/core/shared/domain/services/TextEmbedder';
import {Vector} from '../backend/src/core/shared/domain/value-objects/Vector';
import {DrizzleConnection} from '../backend/src/core/shared/infrastructure/drizzle/DrizzleConnection';
import {EmitteryEventBus} from '../backend/src/core/shared/infrastructure/emittery/EmitteryEventBus';
import {TEXT_MODEL} from '../backend/src/core/shared/infrastructure/transformers/TextModel';

const express = createRequire(new URL('../backend/package.json', import.meta.url))(
  'express'
) as typeof import('express');

// The context under test: what a middleware would open for each request.
const requestContext = new AsyncLocalStorage<{requestId: string}>();
const requestIdNow = (): string => requestContext.getStore()?.requestId ?? 'LOST';

// DrizzleConnection with a fake root: `transaction` gives a marker in place of a pg client.
const root = {
  name: 'root',
  transaction: async <T>(work: (tx: unknown) => Promise<T>) => work({name: 'transaction'})
} as unknown as NodePgDatabase;
const connection = new DrizzleConnection({database: root});
const transactionNow = (): string =>
  connection.database() === root ? 'none' : 'open';

const seen: string[] = [];
const trace = (step: string): void => {
  seen.push(
    `${step.padEnd(46)} request=${requestIdNow().padEnd(5)} transaction=${transactionNow()}`
  );
};
const tick = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// ---------- Part A: the real upload path, with fakes only at the edge (DB, disk, model) ----------

const partA = async (): Promise<void> => {
  const bus = new EmitteryEventBus();
  const rows = new Map<string, unknown>();
  let readyCount = 0;
  let allReady: () => void = () => {};
  const bothReady = new Promise<void>(resolve => {
    allReady = resolve;
  });

  const resourceRepository = {
    findTextResourceByChecksum: async () => {
      trace('A2 land: repository, in the transaction');
      return undefined;
    },
    create: async (resource: {id: {value: string}}) => {
      rows.set(resource.id.value, resource);
    },
    find: async (id: {value: string}) => {
      trace('A6 repository.find (Ingest, then MarkAsReady)');
      return rows.get(id.value);
    },
    update: async () => {
      trace('A7 MarkAsReady: repository.update');
      readyCount += 1;
      if (readyCount === 2) allReady();
    }
  } as unknown as ResourceRepository;
  const fileStore: FileStore = {
    store: async () => {},
    read: async () => {
      trace('A4 Ingest: fileStore.read');
      return Buffer.from('Some text to cut into chunks.');
    },
    delete: async () => {},
    urlOf: key => `/files/${key.value}`
  };
  const textEmbedder: TextEmbedder = {
    embedChunk: async () => {
      // A slow model: the work goes on after the 201.
      await tick(30);
      trace('A5 Ingest: textEmbedder.embedChunk (+30 ms)');
      return Vector.of({values: Array(TEXT_MODEL.width).fill(0.1), model: TEXT_MODEL});
    },
    embedQuery: async () => {
      throw new Error('not used');
    }
  };
  const chunkRepository: ChunkRepository = {
    createMany: async () => {},
    deleteManyByResourceId: async () => {}
  };

  bus.subscribe(
    new IngestTextResourceOnTextResourceCreatedOrRetried({
      fileStore,
      textExtractor: new ContentTypeTextExtractor(),
      cutter: new CodePointCutter(),
      textEmbedder,
      chunkRepository,
      resourceRepository,
      eventBus: bus
    })
  );
  bus.subscribe(
    new MarkTextResourceAsReadyOnTextResourceIngested({
      resourceRepository,
      transactionRunner: connection
    })
  );
  // A second listener of the same event: emittery runs both at the same time.
  bus.subscribe({
    subscribeTo: () =>
      [{EVENT_NAME: 'resources.text_resource.created'}] as never,
    handle: async () => trace('A3 second listener of …Created')
  });

  const controller = new CreateTextResourceController({
    createTextResource: new CreateTextResource({
      resourceRepository,
      fileStore,
      eventBus: bus,
      transactionRunner: connection,
      contentTypeResolver: new ExtensionContentTypeResolver()
    })
  });

  const app = express();

  // The middleware under test: first, before the routes, as an app.use would be.
  app.use((request, response, next) => {
    const requestId = String(request.headers['x-request-id']);
    response.on('finish', () => trace(`A0 response 'finish' listener`));
    requestContext.run({requestId}, next);
  });
  app.post(
    '/resources/texts',
    (_request, _response, next) => {
      trace('A1a before multer');
      next();
    },
    refuseAFileTooLarge,
    takeTheFiles('file'),
    (_request, _response, next) => {
      trace('A1b after multer');
      next();
    },
    takeOneFile,
    async (request: Request, response: Response) => {
      await controller.run(request, response);
      trace('A1c controller: after response.json (201)');
    }
  );

  const server = app.listen(0);
  await new Promise(resolve => server.once('listening', resolve));
  const {port} = server.address() as AddressInfo;

  const upload = (requestId: string, name: string, sizeInBytes: number) => {
    const form = new FormData();
    form.append('file', new Blob(['a'.repeat(sizeInBytes)]), name);
    return fetch(`http://localhost:${port}/resources/texts`, {
      method: 'POST',
      headers: {'x-request-id': requestId},
      body: form
    }).then(answer => {
      trace(`-- client got ${answer.status} for ${requestId}`);
    });
  };

  // Two uploads at the same time: each Ingest must keep its own request.
  // The 4 MB body arrives in many chunks, so multer calls next() from a stream event.
  await Promise.all([
    upload('req-1', 'one.txt', 4 * 1024 * 1024),
    upload('req-2', 'two.txt', 16)
  ]);
  await bothReady;
  server.close();
};

// ---------- Part B: the cases at the edge ----------

const partB = async (): Promise<void> => {
  const bus = new EmitteryEventBus();
  // The real Emittery instance inside the adapter.
  const emitter = (bus as unknown as {emitter: import('emittery').default}).emitter;

  // B1: the context comes from the emit, not from the subscribe.
  requestContext.run({requestId: 'boot'}, () => {
    emitter.on('b1', () => trace('B1 on() at boot, emit() in req-B1'));
  });
  await requestContext.run({requestId: 'reqB1'}, () => emitter.emit('b1'));

  // B2: emitSerial.
  emitter.on('b2', async () => {
    await tick(1);
    trace('B2 emitSerial, listener after an await');
  });
  await requestContext.run({requestId: 'reqB2'}, () => emitter.emitSerial('b2'));

  // B3: timers and queues of the event loop, started in the request.
  await requestContext.run({requestId: 'reqB3'}, async () => {
    await new Promise<void>(resolve => {
      setImmediate(() => trace('B3 setImmediate'));
      queueMicrotask(() => trace('B3 queueMicrotask'));
      process.nextTick(() => trace('B3 process.nextTick'));
      setTimeout(() => {
        trace('B3 setTimeout');
        resolve();
      }, 5);
    });
  });

  // B4: emittery's async iterator, consumed by a loop that starts at boot.
  const iterator = emitter.events('b4');
  const iterated = (async () => {
    for await (const _ of iterator) {
      trace('B4 events() iterator, loop started at boot');
      break;
    }
  })();
  await requestContext.run({requestId: 'reqB4'}, () => emitter.emit('b4'));
  await iterated;

  // B5: a work queue whose worker starts at boot; the request only pushes a job.
  const jobs: Array<() => void> = [];
  let wake: () => void = () => {};
  const worker = (async () => {
    for (;;) {
      if (jobs.length === 0) await new Promise<void>(resolve => (wake = resolve));
      const job = jobs.shift();
      trace('B5 work queue, worker loop started at boot');
      job?.();
      return;
    }
  })();
  requestContext.run({requestId: 'reqB5'}, () => {
    jobs.push(() => {});
    wake();
  });
  await worker;

  // B5b: the same queue, but the job is a closure bound to the context with AsyncLocalStorage.bind.
  const boundJobs: Array<() => void> = [];
  requestContext.run({requestId: 'reqB5b'}, () => {
    boundJobs.push(AsyncLocalStorage.bind(() => trace('B5b work queue, job bound with bind()')));
  });
  boundJobs.shift()?.();

  // B6: a long-lived EventEmitter that another context emits (a socket, a pool, a stream).
  const longLived = new EventEmitter();
  requestContext.run({requestId: 'reqB6'}, () => {
    longLived.once('ping', () => trace('B6 EventEmitter.on in request, emit at boot'));
  });
  longLived.emit('ping');

  // B7: a worker thread. Its isolate has no copy of the store; the 'message' callback on this side.
  await requestContext.run({requestId: 'reqB7'}, async () => {
    const thread = new Worker(
      `const {parentPort} = require('node:worker_threads');
       const {AsyncLocalStorage} = require('node:async_hooks');
       parentPort.postMessage(String(new AsyncLocalStorage().getStore()));`,
      {eval: true}
    );
    await new Promise<void>(resolve => {
      thread.on('message', inside => {
        trace(`B7 worker 'message' callback (inside: ${inside})`);
        resolve();
      });
    });
    await thread.terminate();
  });

  // B8: a publish inside DrizzleConnection.run leaks the transaction into the listeners.
  emitter.on('b8', async () => {
    await tick(5);
    trace('B8 listener of a publish made in run()');
  });
  await requestContext.run({requestId: 'reqB8'}, () =>
    connection.run(async () => {
      void bus.publish([{eventName: 'b8'} as never]);
    })
  );
  await tick(10);
};

await partA();
seen.push('');
await partB();
console.log(`node ${process.version}`);
console.log(seen.join('\n'));
