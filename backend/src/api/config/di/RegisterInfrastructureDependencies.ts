import {drizzle} from 'drizzle-orm/node-postgres';
import {Pool} from 'pg';
import {CodePointCutter} from '../../../core/ingestion/infrastructure/CodePointCutter';
import {ContentTypeTextExtractor} from '../../../core/ingestion/infrastructure/ContentTypeTextExtractor';
import {DrizzleChunkRepository} from '../../../core/ingestion/infrastructure/drizzle/DrizzleChunkRepository';
import {DrizzlePictureRepository} from '../../../core/ingestion/infrastructure/drizzle/DrizzlePictureRepository';
import {SharpImageDecoder} from '../../../core/ingestion/infrastructure/sharp/SharpImageDecoder';
import {DrizzleResourceReader} from '../../../core/resources/infrastructure/drizzle/DrizzleResourceReader';
import {DrizzleResourceRepository} from '../../../core/resources/infrastructure/drizzle/DrizzleResourceRepository';
import {ExtensionContentTypeResolver} from '../../../core/resources/infrastructure/ExtensionContentTypeResolver';
import {DrizzlePictureResultReader} from '../../../core/search/infrastructure/drizzle/DrizzlePictureResultReader';
import {DrizzleResultReader} from '../../../core/search/infrastructure/drizzle/DrizzleResultReader';
import {RERANKER_MODEL} from '../../../core/search/infrastructure/transformers/RerankerModel';
import {TransformersReranker} from '../../../core/search/infrastructure/transformers/TransformersReranker';
import type {ModelCallTracker} from '../../../core/shared/domain/services/ModelCallTracker';
import type {OperationRunner} from '../../../core/shared/domain/services/OperationRunner';
import type {SessionRunner} from '../../../core/shared/domain/services/SessionRunner';
import {AsyncLocalStorageSessionRunner} from '../../../core/shared/infrastructure/async-hooks/AsyncLocalStorageSessionRunner';
import {DrizzleConnection} from '../../../core/shared/infrastructure/drizzle/DrizzleConnection';
import {EmitteryEventBus} from '../../../core/shared/infrastructure/emittery/EmitteryEventBus';
import {FilesystemFileStore} from '../../../core/shared/infrastructure/FilesystemFileStore';
import {LangfuseModelCallTracker} from '../../../core/shared/infrastructure/langfuse/LangfuseModelCallTracker';
import {LangfuseOperationRunner} from '../../../core/shared/infrastructure/langfuse/LangfuseOperationRunner';
import {LangfuseTracing} from '../../../core/shared/infrastructure/langfuse/LangfuseTracing';
import {SilentModelCallTracker} from '../../../core/shared/infrastructure/SilentModelCallTracker';
import {SilentOperationRunner} from '../../../core/shared/infrastructure/SilentOperationRunner';
import {TEXT_MODEL} from '../../../core/shared/infrastructure/transformers/TextModel';
import {TransformersImageEmbedder} from '../../../core/shared/infrastructure/transformers/TransformersImageEmbedder';
import {TransformersTextEmbedder} from '../../../core/shared/infrastructure/transformers/TransformersTextEmbedder';
import {VISION_MODEL} from '../../../core/shared/infrastructure/transformers/VisionModel';
import {env} from '../../env/env';
import {FILES_URL_PREFIX} from '../FilesUrlPrefix';
import {IMAGE_RESULTS_LIMIT} from '../ImageResultsLimit';
import {MATCHES_FIRST_STAGE_LIMIT} from '../MatchesFirstStageLimit';
import {TEXT_RESULTS_LIMIT} from '../TextResultsLimit';
import {container} from './Container';

const startTheCostAdapters = (
  sessionRunner: SessionRunner
): {tracker: ModelCallTracker; operationRunner: OperationRunner} => {
  if (env.langfuse === null) {
    return {
      tracker: new SilentModelCallTracker(),
      operationRunner: new SilentOperationRunner()
    };
  }

  LangfuseTracing.start(env.langfuse);

  return {
    tracker: new LangfuseModelCallTracker({
      models: [TEXT_MODEL, VISION_MODEL, RERANKER_MODEL]
    }),
    operationRunner: new LangfuseOperationRunner({sessionRunner})
  };
};

export const registerInfrastructureDependencies = async (): Promise<void> => {
  const sessionRunner = new AsyncLocalStorageSessionRunner();
  const {tracker, operationRunner} = startTheCostAdapters(sessionRunner);
  const [textEmbedder, imageEmbedder, reranker] = await Promise.all([
    TransformersTextEmbedder.load({tracker}),
    TransformersImageEmbedder.load({tracker}),
    TransformersReranker.load({tracker})
  ]);
  const pool = new Pool({connectionString: env.database.url});
  const connection = new DrizzleConnection({database: drizzle(pool)});

  container.registerImplementation('ModelCallTracker', tracker);
  container.registerImplementation('OperationRunner', operationRunner);
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
  container.registerImplementation(AsyncLocalStorageSessionRunner, sessionRunner);
  container.registerImplementation(
    EmitteryEventBus,
    new EmitteryEventBus({sessionRunner, operationRunner})
  );
  container.registerImplementation(
    ExtensionContentTypeResolver,
    new ExtensionContentTypeResolver()
  );
  container.registerImplementation(TransformersTextEmbedder, textEmbedder);
  container.registerImplementation(TransformersImageEmbedder, imageEmbedder);
  container.registerImplementation(TransformersReranker, reranker);
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
    DrizzlePictureRepository,
    new DrizzlePictureRepository({connection})
  );
  container.registerImplementation(SharpImageDecoder, new SharpImageDecoder());
  container.registerImplementation(
    DrizzleResultReader,
    new DrizzleResultReader({
      connection,
      resultsLimit: TEXT_RESULTS_LIMIT,
      matchesLimit: MATCHES_FIRST_STAGE_LIMIT
    })
  );
  container.registerImplementation(
    DrizzlePictureResultReader,
    new DrizzlePictureResultReader({connection, resultsLimit: IMAGE_RESULTS_LIMIT})
  );
};
