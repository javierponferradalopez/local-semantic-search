import {mkdtemp, readFile, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {PostgreSqlContainer} from '@testcontainers/postgresql';
import {drizzle} from 'drizzle-orm/node-postgres';
import {migrate} from 'drizzle-orm/node-postgres/migrator';
import {Pool} from 'pg';
import type {TestProject} from 'vitest/node';

declare module 'vitest' {
  interface ProvidedContext {
    databaseUrl: string;
    filesDirectory: string;
  }
}

const COMPOSE_FILE = new URL('../../../docker-compose.yml', import.meta.url);
const MIGRATIONS_FOLDER = fileURLToPath(new URL('../../../drizzle', import.meta.url));

const imageOfTheComposeFile = async (): Promise<string> => {
  const compose = await readFile(COMPOSE_FILE, 'utf8');
  const images = [...compose.matchAll(/^\s+image:\s*(\S+)\s*$/gm)].map(match => match[1]);

  if (images.length !== 1) {
    throw new Error(
      `docker-compose.yml declares ${images.length} images, so the test container cannot tell which one holds the store`
    );
  }

  return images[0];
};

const runTheMigrations = async (databaseUrl: string): Promise<void> => {
  const pool = new Pool({connectionString: databaseUrl});

  await migrate(drizzle(pool), {migrationsFolder: MIGRATIONS_FOLDER});
  await pool.end();
};

export default async (project: TestProject): Promise<() => Promise<void>> => {
  const container = await new PostgreSqlContainer(await imageOfTheComposeFile()).start();
  const filesDirectory = await mkdtemp(join(tmpdir(), 'local-semantic-search-'));

  await runTheMigrations(container.getConnectionUri());

  project.provide('databaseUrl', container.getConnectionUri());
  project.provide('filesDirectory', filesDirectory);

  return async (): Promise<void> => {
    await container.stop();
    await rm(filesDirectory, {recursive: true, force: true});
  };
};
