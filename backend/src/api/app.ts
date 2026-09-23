import express, {type Express} from 'express';
import {configureContainer} from './configurators/configureContainer';
import {configureRoutes} from './configurators/configureRoutes';

export const createApp = (): Express => {
  configureContainer();

  const app = express();

  configureRoutes(app);

  return app;
};
