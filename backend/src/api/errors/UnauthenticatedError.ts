export class UnauthenticatedError extends Error {
  private constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'UnauthenticatedError';
  }

  public static causeTheRequestHoldsNoSession(cause: unknown): UnauthenticatedError {
    return new UnauthenticatedError(
      'The request holds no Session in Session-Id and Session-Origin',
      {cause}
    );
  }
}
