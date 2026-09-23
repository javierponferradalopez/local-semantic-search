export class MultipleFilesError extends Error {
  private readonly _count: number;

  private constructor(count: number) {
    super(`${count} files arrived, and the upload takes one`);
    this.name = 'MultipleFilesError';
    this._count = count;
  }

  public static causeMoreThanOneFileArrived(count: number): MultipleFilesError {
    return new MultipleFilesError(count);
  }

  public get count(): number {
    return this._count;
  }
}
