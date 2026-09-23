import {DrizzleResourceReader} from '../../../core/resources/infrastructure/drizzle/DrizzleResourceReader';
import {DrizzleResourceRepository} from '../../../core/resources/infrastructure/drizzle/DrizzleResourceRepository';
import {ExtensionContentTypeResolver} from '../../../core/resources/infrastructure/ExtensionContentTypeResolver';
import {CreateTextResource} from '../../../core/resources/use-cases/CreateTextResource';
import {DeleteResource} from '../../../core/resources/use-cases/DeleteResource';
import {GetResources} from '../../../core/resources/use-cases/GetResources';
import {RetryTextResource} from '../../../core/resources/use-cases/RetryTextResource';
import {DrizzleConnection} from '../../../core/shared/infrastructure/drizzle/DrizzleConnection';
import {FilesystemFileStore} from '../../../core/shared/infrastructure/FilesystemFileStore';
import {InProcessEventBus} from '../../../core/shared/infrastructure/InProcessEventBus';
import {container} from './Container';

export const registerApplicationDependencies = (): void => {
  const resourceRepository = container.getDependency(DrizzleResourceRepository);
  const fileStore = container.getDependency(FilesystemFileStore);
  const eventBus = container.getDependency(InProcessEventBus);
  const transactionRunner = container.getDependency(DrizzleConnection);

  container.registerImplementation(
    CreateTextResource,
    new CreateTextResource({
      resourceRepository,
      fileStore,
      eventBus,
      transactionRunner,
      contentTypeResolver: container.getDependency(ExtensionContentTypeResolver)
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
};
