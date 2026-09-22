import {registerApplicationDependencies} from '../config/di/RegisterApplicationDependencies';
import {registerControllersDependencies} from '../config/di/RegisterControllersDependencies';
import {registerDomainDependencies} from '../config/di/RegisterDomainDependencies';
import {registerInfrastructureDependencies} from '../config/di/RegisterInfrastructureDependencies';

export const configureContainer = (): void => {
  registerInfrastructureDependencies();
  registerDomainDependencies();
  registerApplicationDependencies();
  registerControllersDependencies();
};
