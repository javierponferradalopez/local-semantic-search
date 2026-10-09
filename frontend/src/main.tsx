import type {SessionHeaders} from 'contract/SessionHeaders';
import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import {BrowserRouter} from 'react-router';
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

// Each load of the app is a new Session, so a reload of the tab starts one (ADR-0047).
const sessionHeaders: SessionHeaders = {
  'Session-Id': crypto.randomUUID(),
  'Session-Origin': 'interface'
};

createRoot(root).render(
  <StrictMode>
    <GatewaysProvider
      gateways={{
        resources: new HttpResourceGateway({sessionHeaders}),
        search: new HttpSearchGateway({sessionHeaders})
      }}
    >
      <ResourcesProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ResourcesProvider>
    </GatewaysProvider>
  </StrictMode>
);
