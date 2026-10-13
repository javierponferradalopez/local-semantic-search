import type {
  ModelCall,
  ModelCallRecorder
} from '../../src/core/shared/domain/services/ModelCallRecorder';

// The tests read the Model calls of an adapter here.
export class RecordingModelCallRecorder implements ModelCallRecorder {
  private calls: ModelCall[] = [];

  public record(call: ModelCall): void {
    this.calls.push(call);
  }

  public takeTheCalls(): ModelCall[] {
    const calls = this.calls;

    this.calls = [];

    return calls;
  }
}
