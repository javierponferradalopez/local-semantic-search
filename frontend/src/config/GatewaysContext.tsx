import {createContext, type JSX, type ReactNode, useContext} from 'react';
import type {ResourceGateway} from '@/gateways/ResourceGateway';
import type {SearchGateway} from '@/gateways/SearchGateway';

export type Gateways = {resources: ResourceGateway; search: SearchGateway};

const GatewaysContext = createContext<Gateways | undefined>(undefined);

type Props = {gateways: Gateways; children: ReactNode};

export const GatewaysProvider = ({gateways, children}: Props): JSX.Element => (
  <GatewaysContext value={gateways}>{children}</GatewaysContext>
);

const useGateways = (): Gateways => {
  const gateways = useContext(GatewaysContext);

  if (gateways === undefined) {
    throw new Error('The gateways are missing. The GatewaysProvider is not above.');
  }

  return gateways;
};

export const useResourceGateway = (): ResourceGateway => useGateways().resources;

export const useSearchGateway = (): SearchGateway => useGateways().search;
