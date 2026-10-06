export class BackendUnavailable extends Error {
  private readonly _address: string;

  public constructor(address: string, options?: ErrorOptions) {
    super(`The backend at ${address} does not answer`, options);
    this.name = 'BackendUnavailable';
    this._address = address;
  }

  public get address(): string {
    return this._address;
  }
}
