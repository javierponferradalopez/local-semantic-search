import {config} from 'dotenv';

config({quiet: true});

const getEnv =(name: string): string => {
  const value = process.env[name];

  if (value === undefined) {
    throw new Error(`The environment variable ${name} is not set`);
  }

  return value;
};

export const env = {
  backend: {url: getEnv('BACKEND_URL')}
} as const;
