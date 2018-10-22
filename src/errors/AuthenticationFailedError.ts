export enum AuthenticationFailedReason {
  Unknown = 0,
  InvalidCredentials = 1,
  MissingUsername = 2,
  MissingPassword = 3
}

/**
 * Inidicates that an authentication error occured. Either
 * authentication failed, or there was no authentication
 * information provided.
 */
export default class AuthenticationFailedError extends Error {
  constructor(
    readonly reason: AuthenticationFailedReason = AuthenticationFailedReason.Unknown,
    message?: string
  ) {
    super(message);
    Object.setPrototypeOf(this, AuthenticationFailedError.prototype);
  }
}
