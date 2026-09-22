import express, {type Express} from 'express';
import {configureContainer} from './configurators/configureContainer';

export const createApp = (): Express => {
  configureContainer();

  return express();
};
