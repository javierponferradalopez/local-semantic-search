import {drizzle} from 'drizzle-orm/node-postgres';
import {Pool} from 'pg';
import {CodePointCutter} from '../../../core/ingestion/infrastructure/CodePointCutter';
import {ContentTypeTextExtractor} from '../../../core/ingestion/infrastructure/ContentTypeTextExtractor';
import {DrizzleChunkRepository} from '../../../core/ingestion/infrastructure/drizzle/DrizzleChunkRepository';
import {DrizzleResourceReader} from '../../../core/resources/infrastructure/drizzle/DrizzleResourceReader';
import {DrizzleResourceRepository} from '../../../core/resources/infrastructure/drizzle/DrizzleResourceRepository';
import {ExtensionContentTypeResolver} from '../../../core/resources/infrastructure/ExtensionContentTypeResolver';
import {DrizzleResultReader} from '../../../core/search/infrastructure/drizzle/DrizzleResultReader';
import {DrizzleConnection} from '../../../core/shared/infrastructure/drizzle/DrizzleConnection';
import {EmitteryEventBus} from '../../../core/shared/infrastructure/emittery/EmitteryEventBus';
import {FilesystemFileStore} from '../../../core/shared/infrastructure/FilesystemFileStore';
import {TransformersImageEmbedder} from '../../../core/shared/infrastructure/transformers/TransformersImageEmbedder';
import {TransformersTextEmbedder} from '../../../core/shared/infrastructure/transformers/TransformersTextEmbedder';
import {env} from '../../env/env';
import {FILES_URL_PREFIX} from '../FilesUrlPrefix';
import {MATCHES_LIMIT} from '../MatchesLimit';
import {TEXT_RESULTS_LIMIT} from '../TextResultsLimit';
import {container} from './Container';

export const registerInfrastructureDependencies = async (): Promise<void> => {
  const [textEmbedder, imageEmbedder] = await Promise.all([
    TransformersTextEmbedder.load(),
    TransformersImageEmbedder.load()
  ]);
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
  container.registerImplementation(EmitteryEventBus, new EmitteryEventBus());
  container.registerImplementation(
    ExtensionContentTypeResolver,
    new ExtensionContentTypeResolver()
  );
  container.registerImplementation(TransformersTextEmbedder, textEmbedder);
  container.registerImplementation(TransformersImageEmbedder, imageEmbedder);
  container.registerImplementation(
    DrizzleChunkRepository,
    new DrizzleChunkRepository({connection})
  );
  container.registerImplementation(
    ContentTypeTextExtractor,
    new ContentTypeTextExtractor()
  );
  container.registerImplementation(CodePointCutter, new CodePointCutter());
  container.registerImplementation(
    DrizzleResultReader,
    new DrizzleResultReader({
      connection,
      resultsLimit: TEXT_RESULTS_LIMIT,
      matchesLimit: MATCHES_LIMIT
    })
  );
};
