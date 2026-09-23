import type {Express} from 'express';
import {container} from '../config/di/Container';
import {CreateTextResourceController} from '../controllers/resources/CreateTextResourceController';
import {GetResourcesController} from '../controllers/resources/GetResourcesController';
import {handleErrors} from '../middlewares/handleErrors';
import {refuseAFileTooLarge} from '../middlewares/refuseAFileTooLarge';
import {takeOneFile} from '../middlewares/takeOneFile';
import {takeTheFiles} from '../middlewares/takeTheFiles';

export const configureRoutes = (app: Express): void => {
  const createTextResource = container.getDependency(CreateTextResourceController);
  const getResources = container.getDependency(GetResourcesController);

  app.post(
    '/resources/texts',
    refuseAFileTooLarge,
    takeTheFiles,
    takeOneFile,
    (request, response) => createTextResource.run(request, response)
  );

  app.get('/resources', (request, response) => getResources.run(request, response));

  app.use(handleErrors);
};
