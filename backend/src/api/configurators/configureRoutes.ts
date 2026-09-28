import type {Express} from 'express';
import {container} from '../config/di/Container';
import {FILES_URL_PREFIX} from '../config/FilesUrlPrefix';
import {CreateTextResourceController} from '../controllers/resources/CreateTextResourceController';
import {DeleteTextResourceController} from '../controllers/resources/DeleteTextResourceController';
import {GetResourcesController} from '../controllers/resources/GetResourcesController';
import {RetryTextResourceController} from '../controllers/resources/RetryTextResourceController';
import {GetMatchesController} from '../controllers/search/GetMatchesController';
import {SearchController} from '../controllers/search/SearchController';
import {env} from '../env/env';
import {handleErrors} from '../middlewares/handleErrors';
import {refuseAFileTooLarge} from '../middlewares/refuseAFileTooLarge';
import {serveTheFiles} from '../middlewares/serveTheFiles';
import {takeOneFile} from '../middlewares/takeOneFile';
import {takeTheFiles} from '../middlewares/takeTheFiles';

export const configureRoutes = (app: Express): void => {
  const createTextResource = container.getDependency(CreateTextResourceController);
  const getResources = container.getDependency(GetResourcesController);
  const deleteTextResource = container.getDependency(DeleteTextResourceController);
  const retryTextResource = container.getDependency(RetryTextResourceController);
  const search = container.getDependency(SearchController);
  const getMatches = container.getDependency(GetMatchesController);

  app.post(
    '/resources/texts',
    refuseAFileTooLarge,
    takeTheFiles,
    takeOneFile,
    (request, response) => createTextResource.run(request, response)
  );

  app.get('/resources', (request, response) => getResources.run(request, response));

  app.delete('/resources/texts/:id', (request, response) =>
    deleteTextResource.run(request, response)
  );

  app.post('/resources/texts/:id/retry', (request, response) =>
    retryTextResource.run(request, response)
  );

  app.get('/search', (request, response) => search.run(request, response));

  app.get('/resources/texts/:id/matches', (request, response) =>
    getMatches.run(request, response)
  );

  app.use(FILES_URL_PREFIX, serveTheFiles(env.files.directory));

  app.use(handleErrors);
};
