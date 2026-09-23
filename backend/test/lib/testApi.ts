import {readdir} from 'node:fs/promises';
import type {Server} from 'node:http';
import type {AddressInfo} from 'node:net';
import {CreateTextResourceRequest} from 'contract/CreateTextResourceRequest';
import type {ResourceRow} from 'contract/ResourceRow';
import {Pool} from 'pg';
import {createApp} from '../../src/api/app';
import {container} from '../../src/api/config/di/Container';
import {testFilesDirectory, wipeTheData, wipeTheFiles} from './testInfrastructure';

export type TestApi = {
  origin: () => string;
  createTextResource: (
    name: string,
    content: string | Buffer,
    type?: string
  ) => Promise<Response>;
  createATextResourceRow: (
    name: string,
    content: string | Buffer
  ) => Promise<ResourceRow>;
  getResources: () => Promise<ResourceRow[]>;
  deleteTextResource: (id: string) => Promise<Response>;
  retryTextResource: (id: string) => Promise<Response>;
  expectNothingStored: () => Promise<void>;
};

// Starts the application for the suite that calls it, and wipes the store before each test.
export const useTheTestApi = (): TestApi => {
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

  beforeEach(async () => {
    await wipeTheData();
    await wipeTheFiles();
  });

  const createTextResource = (
    name: string,
    content: string | Buffer,
    type?: string
  ): Promise<Response> => {
    const body = new FormData();

    body.append(CreateTextResourceRequest.filePart, new File([content], name, {type}));

    return fetch(`${origin}/resources/texts`, {method: 'POST', body});
  };

  const createATextResourceRow = async (
    name: string,
    content: string | Buffer
  ): Promise<ResourceRow> =>
    (await (await createTextResource(name, content)).json()) as ResourceRow;

  const getResources = async (): Promise<ResourceRow[]> =>
    (await (await fetch(`${origin}/resources`)).json()) as ResourceRow[];

  const expectNothingStored = async (): Promise<void> => {
    const entries = await readdir(testFilesDirectory(), {
      recursive: true,
      withFileTypes: true
    });

    expect(await getResources()).toStrictEqual([]);
    expect(entries.filter(entry => entry.isFile())).toStrictEqual([]);
  };

  const deleteTextResource = (id: string): Promise<Response> =>
    fetch(`${origin}/resources/texts/${id}`, {method: 'DELETE'});

  const retryTextResource = (id: string): Promise<Response> =>
    fetch(`${origin}/resources/texts/${id}/retry`, {method: 'POST'});

  return {
    origin: () => origin,
    createTextResource,
    createATextResourceRow,
    getResources,
    deleteTextResource,
    retryTextResource,
    expectNothingStored
  };
};
