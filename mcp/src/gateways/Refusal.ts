import type {ErrorItem} from 'contract/ErrorItem';

export class Refusal extends Error {
  private readonly _items: ErrorItem[];

  public constructor(items: ErrorItem[]) {
    super('The backend refused the request');
    this.name = 'Refusal';
    this._items = items;
  }

  public get items(): ErrorItem[] {
    return this._items;
  }
}
