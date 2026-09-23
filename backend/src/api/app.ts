import express, {type Express} from 'express';
import {configureContainer} from './configurators/configureContainer';
import {configureRoutes} from './configurators/configureRoutes';

export const createApp = async (): Promise<Express> => {
  await configureContainer();

  const app = express();

  configureRoutes(app);

  return app;
};
