import {config} from 'dotenv';

config({quiet: true});

const getEnv = (name: string): string => {
  const value = process.env[name];

  if (value === undefined) {
    throw new Error(`The environment variable ${name} is not set`);
  }

  return value;
};

const getWholeNumberEnv = (name: string): number => {
  const value = Number(getEnv(name));

  if (!Number.isInteger(value)) {
    throw new Error(`The environment variable ${name} is not a whole number`);
  }

  return value;
};

const LANGFUSE_VARIABLES = [
  'LANGFUSE_PUBLIC_KEY',
  'LANGFUSE_SECRET_KEY',
  'LANGFUSE_BASE_URL'
] as const;

type LangfuseEnv = {publicKey: string; secretKey: string; baseUrl: string};

// With none of them, the silent adapters run (ADR-0048). An empty value is not set.
const getLangfuseEnv = (): LangfuseEnv | null => {
  const missing = LANGFUSE_VARIABLES.filter(name => !process.env[name]);

  if (missing.length === LANGFUSE_VARIABLES.length) {
    return null;
  }

  if (missing.length > 0) {
    throw new Error(
      `Set all the Langfuse environment variables or none of them. Not set: ${missing.join(', ')}`
    );
  }

  return {
    publicKey: getEnv('LANGFUSE_PUBLIC_KEY'),
    secretKey: getEnv('LANGFUSE_SECRET_KEY'),
    baseUrl: getEnv('LANGFUSE_BASE_URL')
  };
};

export const env = {
  server: {port: getWholeNumberEnv('PORT')},
  database: {url: getEnv('DATABASE_URL')},
  files: {directory: getEnv('FILES_DIRECTORY')},
  langfuse: getLangfuseEnv()
} as const;
