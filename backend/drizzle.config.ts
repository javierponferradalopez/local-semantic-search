import {defineConfig} from 'drizzle-kit';
import {env} from './src/api/env/env';

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/core/**/infrastructure/drizzle/*Schema.ts',
  out: './drizzle',
  dbCredentials: {url: env.database.url}
});
