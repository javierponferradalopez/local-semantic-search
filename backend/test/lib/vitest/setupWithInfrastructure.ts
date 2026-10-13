import {afterAll, beforeAll, inject} from 'vitest';
import {closeTheTestDatabase, wipeTheData} from '../testInfrastructure';

process.env.DATABASE_URL = inject('databaseUrl');
process.env.PORT = '0';
process.env.FILES_DIRECTORY = inject('filesDirectory');
// Empty, so a key in .env does not reach a test: no test calls Langfuse Cloud.
process.env.LANGFUSE_PUBLIC_KEY = '';
process.env.LANGFUSE_SECRET_KEY = '';
process.env.LANGFUSE_BASE_URL = '';

beforeAll(wipeTheData);
afterAll(closeTheTestDatabase);
