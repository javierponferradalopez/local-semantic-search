import {type RenderResult, render} from '@testing-library/react';
import type {ReactNode} from 'react';
import {type Gateways, GatewaysProvider} from '@/config/GatewaysContext';

export const renderWithGateways = (ui: ReactNode, gateways: Gateways): RenderResult =>
  render(<GatewaysProvider gateways={gateways}>{ui}</GatewaysProvider>);
