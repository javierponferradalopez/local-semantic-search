import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import {App} from '@/App';
import {GatewaysProvider} from '@/config/GatewaysContext';
import {HttpResourceGateway} from '@/gateways/http/HttpResourceGateway';
import '@/index.css';

const root = document.getElementById('root');

if (root === null) {
  throw new Error('The root element is missing');
}

createRoot(root).render(
  <StrictMode>
    <GatewaysProvider gateways={{resources: new HttpResourceGateway()}}>
      <App />
    </GatewaysProvider>
  </StrictMode>
);
