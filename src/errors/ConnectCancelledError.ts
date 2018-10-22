/**
 * An error indicating that an {@link ElkConnection} connection attempt
 * was cancelled before a connection was completely established.
 */
export default class ConnectCancelledError extends Error {
  constructor(message: string = 'connect was cancelled.') {
    super(message);
    Object.setPrototypeOf(this, ConnectCancelledError.prototype);
  }
}
