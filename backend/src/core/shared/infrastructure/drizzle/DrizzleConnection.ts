import {AsyncLocalStorage} from 'node:async_hooks';
import type {NodePgDatabase} from 'drizzle-orm/node-postgres';
import type {TransactionRunner} from '../../domain/services/TransactionRunner';

export type DrizzleDatabase =
  | NodePgDatabase
  | Parameters<Parameters<NodePgDatabase['transaction']>[0]>[0];

type ConstructorParams = {database: NodePgDatabase};

export class DrizzleConnection implements TransactionRunner {
  private readonly root: NodePgDatabase;
  private readonly openTransaction = new AsyncLocalStorage<DrizzleDatabase>();

  public constructor({database}: ConstructorParams) {
    this.root = database;
  }

  public database(): DrizzleDatabase {
    return this.openTransaction.getStore() ?? this.root;
  }

  public run<T>(work: () => Promise<T>): Promise<T> {
    return this.root.transaction(transaction =>
      this.openTransaction.run(transaction, work)
    );
  }
}
