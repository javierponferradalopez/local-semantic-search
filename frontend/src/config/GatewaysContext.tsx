import {createContext, type JSX, type ReactNode, useContext} from 'react';
import type {ResourceGateway} from '@/gateways/ResourceGateway';

export type Gateways = {resources: ResourceGateway};

const GatewaysContext = createContext<Gateways | undefined>(undefined);

type Props = {gateways: Gateways; children: ReactNode};

export const GatewaysProvider = ({gateways, children}: Props): JSX.Element => (
  <GatewaysContext value={gateways}>{children}</GatewaysContext>
);

export const useResourceGateway = (): ResourceGateway => {
  const gateways = useContext(GatewaysContext);

  if (gateways === undefined) {
    throw new Error('The gateways are missing. The GatewaysProvider is not above.');
  }

  return gateways.resources;
};
