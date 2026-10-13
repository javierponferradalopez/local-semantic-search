import type {OperationRunner} from '../domain/services/OperationRunner';

export class SilentOperationRunner implements OperationRunner {
  public run<T>(_name: string, work: () => Promise<T>, _input: unknown): Promise<T> {
    return work();
  }
}
