import {registerApplicationDependencies} from '../config/di/RegisterApplicationDependencies';
import {registerControllersDependencies} from '../config/di/RegisterControllersDependencies';
import {registerDomainDependencies} from '../config/di/RegisterDomainDependencies';
import {registerDomainEventHandlers} from '../config/di/RegisterDomainEventHandlers';
import {registerInfrastructureDependencies} from '../config/di/RegisterInfrastructureDependencies';

export const configureContainer = async (): Promise<void> => {
  await registerInfrastructureDependencies();
  registerDomainDependencies();
  registerApplicationDependencies();
  registerDomainEventHandlers();
  registerControllersDependencies();
};
