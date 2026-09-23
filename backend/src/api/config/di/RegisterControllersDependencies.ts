import {CreateTextResource} from '../../../core/resources/use-cases/CreateTextResource';
import {GetResources} from '../../../core/resources/use-cases/GetResources';
import {CreateTextResourceController} from '../../controllers/resources/CreateTextResourceController';
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
};
