import type {ModelCallRecorder} from '../domain/services/ModelCallRecorder';

export class SilentModelCallRecorder implements ModelCallRecorder {
  public record(): void {}
}
