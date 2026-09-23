import {APP_NAME} from 'contract/AppName';
import {createApp} from './app';
import {createResourcesFolder} from './config/createResourcesFolder';
import {env} from './env/env';

const start = async (): Promise<void> => {
  await createResourcesFolder();

  const app = await createApp();

  app.listen(env.server.port, () => {
    console.log(`${APP_NAME} listens on http://localhost:${env.server.port}`);
  });
};

start().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
