import {DrizzleResourceReader} from '../../../core/resources/infrastructure/drizzle/DrizzleResourceReader';
import {DrizzleResourceRepository} from '../../../core/resources/infrastructure/drizzle/DrizzleResourceRepository';
import {ExtensionContentTypeResolver} from '../../../core/resources/infrastructure/ExtensionContentTypeResolver';
import {CreateTextResource} from '../../../core/resources/use-cases/CreateTextResource';
import {GetResources} from '../../../core/resources/use-cases/GetResources';
import {DrizzleConnection} from '../../../core/shared/infrastructure/drizzle/DrizzleConnection';
import {FilesystemFileStore} from '../../../core/shared/infrastructure/FilesystemFileStore';
import {InProcessEventBus} from '../../../core/shared/infrastructure/InProcessEventBus';
import {container} from './Container';

export const registerApplicationDependencies = (): void => {
  const fileStore = container.getDependency(FilesystemFileStore);

  container.registerImplementation(
    CreateTextResource,
    new CreateTextResource({
      resourceRepository: container.getDependency(DrizzleResourceRepository),
      fileStore,
      eventBus: container.getDependency(InProcessEventBus),
      transactionRunner: container.getDependency(DrizzleConnection),
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
};
