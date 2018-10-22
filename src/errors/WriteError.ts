import ElkConnectionState from '../connection/ElkConnectionState';

/**
 * Indicates that an {@link ElkConnection} was not in a writeable state,
 * so a command could not be successfully sent.
 */
export default class WriteError extends Error {
  constructor(readonly state: ElkConnectionState, message: string = 'Connection is not writeable') {
    super(message);
    Object.setPrototypeOf(this, WriteError.prototype);
  }
}
