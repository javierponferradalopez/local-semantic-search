import {drizzle} from 'drizzle-orm/node-postgres';
import {Pool} from 'pg';
import {DrizzleResourceReader} from '../../../core/resources/infrastructure/drizzle/DrizzleResourceReader';
import {DrizzleResourceRepository} from '../../../core/resources/infrastructure/drizzle/DrizzleResourceRepository';
import {ExtensionContentTypeResolver} from '../../../core/resources/infrastructure/ExtensionContentTypeResolver';
import {DrizzleConnection} from '../../../core/shared/infrastructure/drizzle/DrizzleConnection';
import {FilesystemFileStore} from '../../../core/shared/infrastructure/FilesystemFileStore';
import {InProcessEventBus} from '../../../core/shared/infrastructure/InProcessEventBus';
import {env} from '../../env/env';
import {container} from './Container';

const FILES_URL_PREFIX = '/files';

export const registerInfrastructureDependencies = (): void => {
  const pool = new Pool({connectionString: env.database.url});
  const connection = new DrizzleConnection({database: drizzle(pool)});

  container.registerImplementation(Pool, pool);
  container.registerImplementation(DrizzleConnection, connection);
  container.registerImplementation(
    DrizzleResourceRepository,
    new DrizzleResourceRepository({connection})
  );
  container.registerImplementation(
    DrizzleResourceReader,
    new DrizzleResourceReader({connection})
  );
  container.registerImplementation(
    FilesystemFileStore,
    new FilesystemFileStore({folder: env.files.directory, urlPrefix: FILES_URL_PREFIX})
  );
  container.registerImplementation(InProcessEventBus, new InProcessEventBus());
  container.registerImplementation(
    ExtensionContentTypeResolver,
    new ExtensionContentTypeResolver()
  );
};
