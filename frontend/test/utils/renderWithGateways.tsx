import {type RenderResult, render} from '@testing-library/react';
import type {ReactNode} from 'react';
import {MemoryRouter} from 'react-router';
import {type Gateways, GatewaysProvider} from '@/config/GatewaysContext';
import type {ResourceGateway} from '@/gateways/ResourceGateway';
import type {SearchGateway} from '@/gateways/SearchGateway';
import {ResourcesProvider} from '@/resources/ResourcesContext';
import {mock} from './mock';

export const renderWithGateways = (
  ui: ReactNode,
  gateways: Partial<Gateways>,
  {route = '/'}: {route?: string} = {}
): RenderResult =>
  render(
    <GatewaysProvider
      gateways={{
        resources: mock<ResourceGateway>(),
        search: mock<SearchGateway>(),
        ...gateways
      }}
    >
      <ResourcesProvider>
        <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
      </ResourcesProvider>
    </GatewaysProvider>
  );
