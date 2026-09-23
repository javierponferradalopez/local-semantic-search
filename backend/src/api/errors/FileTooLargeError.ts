export class FileTooLargeError extends Error {
  private readonly _sizeInBytes: number;
  private readonly _limitInBytes: number;

  private constructor(sizeInBytes: number, limitInBytes: number) {
    super(`The body holds ${sizeInBytes} bytes, above the limit of ${limitInBytes}`);
    this.name = 'FileTooLargeError';
    this._sizeInBytes = sizeInBytes;
    this._limitInBytes = limitInBytes;
  }

  public static causeTheBodyIsAboveTheLimit({
    sizeInBytes,
    limitInBytes
  }: {
    sizeInBytes: number;
    limitInBytes: number;
  }): FileTooLargeError {
    return new FileTooLargeError(sizeInBytes, limitInBytes);
  }

  public get sizeInBytes(): number {
    return this._sizeInBytes;
  }

  public get limitInBytes(): number {
    return this._limitInBytes;
  }
}
