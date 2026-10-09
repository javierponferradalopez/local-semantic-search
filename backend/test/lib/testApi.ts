import {randomUUID} from 'node:crypto';
import {readdir} from 'node:fs/promises';
import type {Server} from 'node:http';
import type {AddressInfo} from 'node:net';
import {CreateImageResourceRequest} from 'contract/CreateImageResourceRequest';
import {CreateTextResourceRequest} from 'contract/CreateTextResourceRequest';
import type {ResourceRow} from 'contract/ResourceRow';
import type {SessionHeaders} from 'contract/SessionHeaders';
import {Pool} from 'pg';
import {createApp} from '../../src/api/app';
import {container} from '../../src/api/config/di/Container';
import {testFilesDirectory, wipeTheData, wipeTheFiles} from './testInfrastructure';

export type TestApi = {
  origin: () => string;
  sessionHeaders: () => SessionHeaders;
  fetch: (path: string, init?: Omit<RequestInit, 'headers'>) => Promise<Response>;
  createTextResource: (
    name: string,
    content: string | Buffer,
    type?: string
  ) => Promise<Response>;
  createATextResourceRow: (
    name: string,
    content: string | Buffer
  ) => Promise<ResourceRow>;
  createImageResource: (name: string, content: string | Buffer) => Promise<Response>;
  createAnImageResourceRow: (
    name: string,
    content: string | Buffer
  ) => Promise<ResourceRow>;
  getResources: () => Promise<ResourceRow[]>;
  deleteTextResource: (id: string) => Promise<Response>;
  deleteImageResource: (id: string) => Promise<Response>;
  retryTextResource: (id: string) => Promise<Response>;
  retryImageResource: (id: string) => Promise<Response>;
  search: (query: string) => Promise<Response>;
  matches: (id: string, query: string) => Promise<Response>;
  rowOnceIngested: (id: string) => Promise<ResourceRow>;
  expectNothingStored: () => Promise<void>;
};

const SESSION_HEADERS: SessionHeaders = {
  'Session-Id': randomUUID(),
  'Session-Origin': 'interface'
};

const INGEST_TIME_LIMIT_IN_MS = 20_000;
const READ_INTERVAL_IN_MS = 100;

type Params = {wipeTheStore?: 'before each test' | 'once'};

// Starts the application for the suite that calls it, and wipes the store.
export const useTheTestApi = ({
  wipeTheStore = 'before each test'
}: Params = {}): TestApi => {
  let server: Server;
  let origin: string;

  beforeAll(async () => {
    server = (await createApp()).listen(0);
    origin = `http://localhost:${(server.address() as AddressInfo).port}`;
  });

  afterAll(async () => {
    server.close();
    await container.getDependency(Pool).end();
  });

  const wipe = async (): Promise<void> => {
    await wipeTheData();
    await wipeTheFiles();
  };

  const fetchWithTheSession = (
    path: string,
    init?: Omit<RequestInit, 'headers'>
  ): Promise<Response> => fetch(`${origin}${path}`, {...init, headers: SESSION_HEADERS});

  if (wipeTheStore === 'once') {
    beforeAll(wipe);
  } else {
    beforeEach(wipe);
  }

  const createTextResource = (
    name: string,
    content: string | Buffer,
    type?: string
  ): Promise<Response> => {
    const body = new FormData();

    body.append(CreateTextResourceRequest.filePart, new File([content], name, {type}));

    return fetchWithTheSession('/resources/texts', {method: 'POST', body});
  };

  const createATextResourceRow = async (
    name: string,
    content: string | Buffer
  ): Promise<ResourceRow> =>
    (await (await createTextResource(name, content)).json()) as ResourceRow;

  const createImageResource = (
    name: string,
    content: string | Buffer
  ): Promise<Response> => {
    const body = new FormData();

    body.append(CreateImageResourceRequest.filePart, new File([content], name));

    return fetchWithTheSession('/resources/images', {method: 'POST', body});
  };

  const createAnImageResourceRow = async (
    name: string,
    content: string | Buffer
  ): Promise<ResourceRow> =>
    (await (await createImageResource(name, content)).json()) as ResourceRow;

  const getResources = async (): Promise<ResourceRow[]> =>
    (await (await fetchWithTheSession('/resources')).json()) as ResourceRow[];

  const expectNothingStored = async (): Promise<void> => {
    const entries = await readdir(testFilesDirectory(), {
      recursive: true,
      withFileTypes: true
    });

    expect(await getResources()).toStrictEqual([]);
    expect(entries.filter(entry => entry.isFile())).toStrictEqual([]);
  };

  const deleteTextResource = (id: string): Promise<Response> =>
    fetchWithTheSession(`/resources/texts/${id}`, {method: 'DELETE'});

  const deleteImageResource = (id: string): Promise<Response> =>
    fetchWithTheSession(`/resources/images/${id}`, {method: 'DELETE'});

  const retryTextResource = (id: string): Promise<Response> =>
    fetchWithTheSession(`/resources/texts/${id}/retry`, {method: 'POST'});

  const retryImageResource = (id: string): Promise<Response> =>
    fetchWithTheSession(`/resources/images/${id}/retry`, {method: 'POST'});

  const search = (query: string): Promise<Response> =>
    fetchWithTheSession(`/search?${new URLSearchParams({q: query})}`);

  const matches = (id: string, query: string): Promise<Response> =>
    fetchWithTheSession(
      `/resources/texts/${id}/matches?${new URLSearchParams({q: query})}`
    );

  // Reads the row through the API, and never waits on the bus (ADR-0024).
  const rowOnceIngested = async (id: string): Promise<ResourceRow> => {
    const deadline = Date.now() + INGEST_TIME_LIMIT_IN_MS;

    while (Date.now() < deadline) {
      const row = (await getResources()).find(resource => resource.id === id);

      if (row !== undefined && row.ingestState !== 'ingesting') {
        return row;
      }

      await new Promise(resolve => setTimeout(resolve, READ_INTERVAL_IN_MS));
    }

    throw new Error(`The Resource ${id} is still Ingesting after the time limit`);
  };

  return {
    origin: () => origin,
    sessionHeaders: () => SESSION_HEADERS,
    fetch: fetchWithTheSession,
    createTextResource,
    createATextResourceRow,
    createImageResource,
    createAnImageResourceRow,
    getResources,
    deleteTextResource,
    deleteImageResource,
    retryTextResource,
    retryImageResource,
    search,
    matches,
    rowOnceIngested,
    expectNothingStored
  };
};
