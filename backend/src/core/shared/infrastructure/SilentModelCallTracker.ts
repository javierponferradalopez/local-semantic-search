import type {ModelCallTracker} from '../domain/services/ModelCallTracker';

export class SilentModelCallTracker implements ModelCallTracker {
  public track(): void {}
}
