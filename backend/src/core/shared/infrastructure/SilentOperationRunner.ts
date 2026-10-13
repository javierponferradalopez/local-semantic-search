import type {OperationRunner} from '../domain/services/OperationRunner';

export class SilentOperationRunner implements OperationRunner {
  public run<T>(_name: string, work: () => Promise<T>): Promise<T> {
    return work();
  }
}
