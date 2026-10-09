import {CreateImageResourceRequest} from 'contract/CreateImageResourceRequest';
import {CreateTextResourceRequest} from 'contract/CreateTextResourceRequest';
import type {Express} from 'express';
import {AsyncLocalStorageSessionRunner} from '../../core/shared/infrastructure/async-hooks/AsyncLocalStorageSessionRunner';
import {container} from '../config/di/Container';
import {FILES_URL_PREFIX} from '../config/FilesUrlPrefix';
import {CreateImageResourceController} from '../controllers/resources/CreateImageResourceController';
import {CreateTextResourceController} from '../controllers/resources/CreateTextResourceController';
import {DeleteImageResourceController} from '../controllers/resources/DeleteImageResourceController';
import {DeleteTextResourceController} from '../controllers/resources/DeleteTextResourceController';
import {GetResourcesController} from '../controllers/resources/GetResourcesController';
import {RetryImageResourceController} from '../controllers/resources/RetryImageResourceController';
import {RetryTextResourceController} from '../controllers/resources/RetryTextResourceController';
import {GetMatchesController} from '../controllers/search/GetMatchesController';
import {SearchController} from '../controllers/search/SearchController';
import {env} from '../env/env';
import {handleErrors} from '../middlewares/handleErrors';
import {refuseAFileTooLarge} from '../middlewares/refuseAFileTooLarge';
import {requireTheSession} from '../middlewares/requireTheSession';
import {serveTheFiles} from '../middlewares/serveTheFiles';
import {takeOneFile} from '../middlewares/takeOneFile';
import {takeTheFiles} from '../middlewares/takeTheFiles';

export const configureRoutes = (app: Express): void => {
  const createTextResource = container.getDependency(CreateTextResourceController);
  const createImageResource = container.getDependency(CreateImageResourceController);
  const getResources = container.getDependency(GetResourcesController);
  const deleteTextResource = container.getDependency(DeleteTextResourceController);
  const deleteImageResource = container.getDependency(DeleteImageResourceController);
  const retryTextResource = container.getDependency(RetryTextResourceController);
  const retryImageResource = container.getDependency(RetryImageResourceController);
  const search = container.getDependency(SearchController);
  const getMatches = container.getDependency(GetMatchesController);
  const sessionRunner = container.getDependency(AsyncLocalStorageSessionRunner);

  // Before the Session: an <img> cannot send a header (ADR-0047).
  app.use(FILES_URL_PREFIX, serveTheFiles(env.files.directory));

  app.use(requireTheSession(sessionRunner));

  app.post(
    '/resources/texts',
    refuseAFileTooLarge,
    takeTheFiles(CreateTextResourceRequest.filePart),
    takeOneFile,
    (request, response) => createTextResource.run(request, response)
  );

  app.post(
    '/resources/images',
    refuseAFileTooLarge,
    takeTheFiles(CreateImageResourceRequest.filePart),
    takeOneFile,
    (request, response) => createImageResource.run(request, response)
  );

  app.get('/resources', (request, response) => getResources.run(request, response));

  app.delete('/resources/texts/:id', (request, response) =>
    deleteTextResource.run(request, response)
  );

  app.delete('/resources/images/:id', (request, response) =>
    deleteImageResource.run(request, response)
  );

  app.post('/resources/texts/:id/retry', (request, response) =>
    retryTextResource.run(request, response)
  );

  app.post('/resources/images/:id/retry', (request, response) =>
    retryImageResource.run(request, response)
  );

  app.get('/search', (request, response) => search.run(request, response));

  app.get('/resources/texts/:id/matches', (request, response) =>
    getMatches.run(request, response)
  );

  app.use(handleErrors);
};
