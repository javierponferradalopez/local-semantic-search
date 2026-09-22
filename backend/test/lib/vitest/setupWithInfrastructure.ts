import {afterAll, beforeAll, inject} from 'vitest';
import {closeTheTestDatabase, wipeTheData} from '../testInfrastructure';

process.env.DATABASE_URL = inject('databaseUrl');
process.env.PORT = '0';

beforeAll(wipeTheData);
afterAll(closeTheTestDatabase);
