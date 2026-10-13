import {APP_NAME} from 'contract/AppName';
import {LangfuseTracing} from '../core/shared/infrastructure/langfuse/LangfuseTracing';
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

const stop = async (): Promise<void> => {
  try {
    await LangfuseTracing.shutdown();
  } finally {
    process.exit();
  }
};

process.once('SIGTERM', stop);
process.once('SIGINT', stop);

start().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
