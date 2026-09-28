import {type RenderResult, render} from '@testing-library/react';
import type {ReactNode} from 'react';
import {type Gateways, GatewaysProvider} from '@/config/GatewaysContext';
import type {ResourceGateway} from '@/gateways/ResourceGateway';
import type {SearchGateway} from '@/gateways/SearchGateway';
import {mock} from './mock';

export const renderWithGateways = (
  ui: ReactNode,
  gateways: Partial<Gateways>
): RenderResult =>
  render(
    <GatewaysProvider
      gateways={{
        resources: mock<ResourceGateway>(),
        search: mock<SearchGateway>(),
        ...gateways
      }}
    >
      {ui}
    </GatewaysProvider>
  );
