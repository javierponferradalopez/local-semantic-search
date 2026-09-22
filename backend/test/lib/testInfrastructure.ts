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

export const closeTheTestDatabase = async (): Promise<void> => {
  await pool?.end();
  pool = undefined;
};
