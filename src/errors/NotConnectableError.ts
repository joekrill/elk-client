import ElkConnectionState from '../connection/ElkConnectionState';

/**
 * Idicates that an operation failed because the {@link ElkConnection}
 * was not in an expected or valid state.
 */
export default class NotConnectableError extends Error {
  /**
   *
   * @param state The state of the {@link ElkConnection}
   * @param allowedStates The states that would be expected or valid for the operation
   *   to be successful
   */
  constructor(readonly state: ElkConnectionState, message?: string) {
    super(message);
    Object.setPrototypeOf(this, NotConnectableError.prototype);
  }
}
