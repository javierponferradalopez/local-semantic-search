import {DrizzleResourceReader} from '../../../core/resources/infrastructure/drizzle/DrizzleResourceReader';
import {DrizzleResourceRepository} from '../../../core/resources/infrastructure/drizzle/DrizzleResourceRepository';
import {ExtensionContentTypeResolver} from '../../../core/resources/infrastructure/ExtensionContentTypeResolver';
import {CreateImageResource} from '../../../core/resources/use-cases/CreateImageResource';
import {CreateTextResource} from '../../../core/resources/use-cases/CreateTextResource';
import {DeleteResource} from '../../../core/resources/use-cases/DeleteResource';
import {GetResources} from '../../../core/resources/use-cases/GetResources';
import {RetryImageResource} from '../../../core/resources/use-cases/RetryImageResource';
import {RetryTextResource} from '../../../core/resources/use-cases/RetryTextResource';
import {DrizzlePictureResultReader} from '../../../core/search/infrastructure/drizzle/DrizzlePictureResultReader';
import {DrizzleResultReader} from '../../../core/search/infrastructure/drizzle/DrizzleResultReader';
import {RERANKER_MODEL} from '../../../core/search/infrastructure/transformers/RerankerModel';
import {TransformersReranker} from '../../../core/search/infrastructure/transformers/TransformersReranker';
import {GetMatches} from '../../../core/search/use-cases/GetMatches';
import {Search} from '../../../core/search/use-cases/Search';
import {DrizzleConnection} from '../../../core/shared/infrastructure/drizzle/DrizzleConnection';
import {EmitteryEventBus} from '../../../core/shared/infrastructure/emittery/EmitteryEventBus';
import {FilesystemFileStore} from '../../../core/shared/infrastructure/FilesystemFileStore';
import {TransformersImageEmbedder} from '../../../core/shared/infrastructure/transformers/TransformersImageEmbedder';
import {TransformersTextEmbedder} from '../../../core/shared/infrastructure/transformers/TransformersTextEmbedder';
import {VISION_MODEL} from '../../../core/shared/infrastructure/transformers/VisionModel';
import {container} from './Container';

export const registerApplicationDependencies = (): void => {
  const resourceRepository = container.getDependency(DrizzleResourceRepository);
  const fileStore = container.getDependency(FilesystemFileStore);
  const eventBus = container.getDependency(EmitteryEventBus);
  const transactionRunner = container.getDependency(DrizzleConnection);
  const textEmbedder = container.getDependency(TransformersTextEmbedder);
  const resultReader = container.getDependency(DrizzleResultReader);
  const contentTypeResolver = container.getDependency(ExtensionContentTypeResolver);

  container.registerImplementation(
    CreateTextResource,
    new CreateTextResource({
      resourceRepository,
      fileStore,
      eventBus,
      transactionRunner,
      contentTypeResolver
    })
  );

  container.registerImplementation(
    CreateImageResource,
    new CreateImageResource({
      resourceRepository,
      fileStore,
      eventBus,
      transactionRunner,
      contentTypeResolver
    })
  );

  container.registerImplementation(
    GetResources,
    new GetResources({
      resourceReader: container.getDependency(DrizzleResourceReader),
      fileStore
    })
  );

  container.registerImplementation(
    DeleteResource,
    new DeleteResource({resourceRepository, fileStore, eventBus, transactionRunner})
  );

  container.registerImplementation(
    RetryTextResource,
    new RetryTextResource({resourceRepository, fileStore, eventBus, transactionRunner})
  );

  container.registerImplementation(
    RetryImageResource,
    new RetryImageResource({resourceRepository, fileStore, eventBus, transactionRunner})
  );

  container.registerImplementation(
    Search,
    new Search({
      textEmbedder,
      imageEmbedder: container.getDependency(TransformersImageEmbedder),
      resultReader,
      reranker: container.getDependency(TransformersReranker),
      pictureResultReader: container.getDependency(DrizzlePictureResultReader),
      fileStore,
      textFloor: RERANKER_MODEL.floor,
      imageFloor: VISION_MODEL.floor
    })
  );

  container.registerImplementation(
    GetMatches,
    new GetMatches({textEmbedder, resultReader})
  );
};
