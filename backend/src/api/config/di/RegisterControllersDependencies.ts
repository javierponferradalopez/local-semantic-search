import {CreateTextResource} from '../../../core/resources/use-cases/CreateTextResource';
import {DeleteResource} from '../../../core/resources/use-cases/DeleteResource';
import {GetResources} from '../../../core/resources/use-cases/GetResources';
import {RetryTextResource} from '../../../core/resources/use-cases/RetryTextResource';
import {CreateTextResourceController} from '../../controllers/resources/CreateTextResourceController';
import {DeleteTextResourceController} from '../../controllers/resources/DeleteTextResourceController';
import {GetResourcesController} from '../../controllers/resources/GetResourcesController';
import {RetryTextResourceController} from '../../controllers/resources/RetryTextResourceController';
import {container} from './Container';

export const registerControllersDependencies = (): void => {
  container.registerImplementation(
    CreateTextResourceController,
    new CreateTextResourceController({
      createTextResource: container.getDependency(CreateTextResource)
    })
  );

  container.registerImplementation(
    GetResourcesController,
    new GetResourcesController({getResources: container.getDependency(GetResources)})
  );

  container.registerImplementation(
    DeleteTextResourceController,
    new DeleteTextResourceController({
      deleteResource: container.getDependency(DeleteResource)
    })
  );

  container.registerImplementation(
    RetryTextResourceController,
    new RetryTextResourceController({
      retryTextResource: container.getDependency(RetryTextResource)
    })
  );
};
