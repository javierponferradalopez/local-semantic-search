export interface OperationRunner {
  // Never breaks the work: when the trace cannot open, the work runs with no trace (ADR-0048).
  run<T>(name: string, work: () => Promise<T>): Promise<T>;
}
