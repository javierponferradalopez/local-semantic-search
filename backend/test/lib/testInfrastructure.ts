import {readdir, rm} from 'node:fs/promises';
import {join} from 'node:path';
import {Pool} from 'pg';
import {inject} from 'vitest';

let pool: Pool | undefined;

export const testDatabase = (): Pool => {
  pool ??= new Pool({connectionString: inject('databaseUrl')});

  return pool;
};

export const testFilesDirectory = (): string => inject('filesDirectory');

export const wipeTheData = async (): Promise<void> => {
  const {rows} = await testDatabase().query<{table: string}>(
    "SELECT quote_ident(tablename) AS table FROM pg_tables WHERE schemaname = 'public'"
  );

  if (rows.length === 0) {
    return;
  }

  const tables = rows.map(row => row.table).join(', ');

  await testDatabase().query(`TRUNCATE TABLE ${tables} RESTART IDENTITY CASCADE`);
};

export const wipeTheFiles = async (): Promise<void> => {
  const entries = await readdir(testFilesDirectory());

  await Promise.all(
    entries.map(entry =>
      rm(join(testFilesDirectory(), entry), {recursive: true, force: true})
    )
  );
};

// The API shows no Chunk, so a test reads the tables.
export const countTheChunksAndVectorsOf = async (
  resourceId: string
): Promise<{chunks: number; vectors: number}> => {
  const {rows} = await testDatabase().query<{chunks: number; vectors: number}>(
    `SELECT count(DISTINCT chunks.id)::int AS chunks, count(vectors_384.chunk_id)::int AS vectors
     FROM chunks LEFT JOIN vectors_384 ON vectors_384.chunk_id = chunks.id
     WHERE chunks.resource_id = $1`,
    [resourceId]
  );

  return rows[0] as {chunks: number; vectors: number};
};

export const closeTheTestDatabase = async (): Promise<void> => {
  await pool?.end();
  pool = undefined;
};
