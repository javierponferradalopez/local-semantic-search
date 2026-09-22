import {APP_NAME} from 'contract/AppName';
import {createApp} from './app';
import {createResourcesFolder} from './config/createResourcesFolder';
import {env} from './env/env';

await createResourcesFolder();

createApp().listen(env.server.port, () => {
  console.log(`${APP_NAME} listens on http://localhost:${env.server.port}`);
});
