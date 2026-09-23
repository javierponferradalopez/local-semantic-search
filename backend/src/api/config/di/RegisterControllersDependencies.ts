import {CreateTextResource} from '../../../core/resources/use-cases/CreateTextResource';
import {DeleteResource} from '../../../core/resources/use-cases/DeleteResource';
import {GetResources} from '../../../core/resources/use-cases/GetResources';
import {CreateTextResourceController} from '../../controllers/resources/CreateTextResourceController';
import {DeleteTextResourceController} from '../../controllers/resources/DeleteTextResourceController';
import {GetResourcesController} from '../../controllers/resources/GetResourcesController';
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
};
