import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import {App} from '@/App';
import {GatewaysProvider} from '@/config/GatewaysContext';
import {HttpResourceGateway} from '@/gateways/http/HttpResourceGateway';
import {HttpSearchGateway} from '@/gateways/http/HttpSearchGateway';
import {ResourcesProvider} from '@/resources/ResourcesContext';
import '@/index.css';

const root = document.getElementById('root');

if (root === null) {
  throw new Error('The root element is missing');
}

createRoot(root).render(
  <StrictMode>
    <GatewaysProvider
      gateways={{resources: new HttpResourceGateway(), search: new HttpSearchGateway()}}
    >
      <ResourcesProvider>
        <App />
      </ResourcesProvider>
    </GatewaysProvider>
  </StrictMode>
);
