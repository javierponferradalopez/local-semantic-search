import type {
  ModelCall,
  ModelCallTracker
} from '../../src/core/shared/domain/services/ModelCallTracker';

// The tests read the Model calls of an adapter here.
export class RecordingModelCallTracker implements ModelCallTracker {
  private calls: ModelCall[] = [];

  public track(call: ModelCall): void {
    this.calls.push(call);
  }

  public takeTheCalls(): ModelCall[] {
    const calls = this.calls;

    this.calls = [];

    return calls;
  }
}
