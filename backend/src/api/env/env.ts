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

export const env = {
  server: {port: getWholeNumberEnv('PORT')},
  database: {url: getEnv('DATABASE_URL')}
} as const;
