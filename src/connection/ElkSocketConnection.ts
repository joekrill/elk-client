import { Socket } from 'net';
import { EventEmitter } from 'events';
import createSocket from './createSocket';
import ElkSocketConnectionOptions, {
  DEFAULT_OPTIONS,
  SECURE_DEFAULT_OPTIONS
} from './ElkSocketConnectionOptions';
import ElkConnection, { STATE_CHANGE_EVENT_NAMES } from './ElkConnection';
import ElkConnectionState from './ElkConnectionState';
import WriteError from '../errors/WriteError';
import TimeoutError from '../errors/TimeoutError';
import ConnectCancelledError from '../errors/ConnectCancelledError';
import NotConnectableError from '../errors/NotConnectableError';
import withTimeout from '../withTimeout';

/**
 * A connection to an Elk M1 via a TCP socket.
 */
class ElkSocketConnection extends EventEmitter implements ElkConnection {
  /**
   * The current options being used for this connection.
   */
  readonly options: ElkSocketConnectionOptions;

  /**
   * The underlying socket connection. Only defined when the connection
   * is active (not `Disconnected`).
   * Do not set this directly -- use {@link setSocket}
   */
  private _socket: Socket | undefined;

  /**
   * The most recent state of the connection.
   * Used by {@link checkForStateChange} to determine if a state change
   * event needs to be emitted.
   */
  private _lastState: ElkConnectionState = ElkConnectionState.Disconnected;

  constructor(readonly initialOptions: Partial<ElkSocketConnectionOptions> = {}) {
    super();

    this.options = {
      ...(initialOptions.secure ? SECURE_DEFAULT_OPTIONS : DEFAULT_OPTIONS),
      ...initialOptions
    };
  }

  /**
   * The current state of the connection.
   */
  get state() {
    if (this._socket) {
      if (this._socket.destroyed) {
        return ElkConnectionState.Disconnected;
      }

      if (this._socket.connecting) {
        return ElkConnectionState.Connecting;
      }

      if (this._socket.writable && this._socket.readable) {
        return ElkConnectionState.Connected;
      }

      return ElkConnectionState.Disconnecting;
    }

    return ElkConnectionState.Disconnected;
  }

  /**
   * Sets the underlying socket being used by the connection.
   */
  private setSocket(socket?: Socket) {
    if (this._socket === socket) {
      // Sanity check: this really shouldn't happen.
      // If it does, there's no change so we have nothing to do.
      return;
    }

    if (this._socket) {
      // If we're replacing (or removing) an existing socket,
      // remove all of our listeners.
      this._socket.removeListener('connect', this.onSocketConnect);
      this._socket.removeListener('data', this.onSocketData);
      this._socket.removeListener('timeout', this.onSocketTimeout);
      this._socket.removeListener('error', this.onSocketError);
      this._socket.removeListener('end', this.onSocketEnd);
      this._socket.removeListener('close', this.onSocketClose);
    }

    this._socket = socket;

    // Assigning a new socket very likely changes the connection state,
    // so we may need to emit an event.
    this.checkForStateChange();

    if (this._socket) {
      // Add listeners if we've got a new socket instance.
      this._socket.on('connect', this.onSocketConnect);
      this._socket.on('data', this.onSocketData);
      this._socket.on('timeout', this.onSocketTimeout);
      this._socket.on('error', this.onSocketError);
      this._socket.on('end', this.onSocketEnd);
      this._socket.on('close', this.onSocketClose);
    }
  }

  /**
   * Checks to see if the current connection state has changed and
   * emits the appropriate event if it has.
   */
  private checkForStateChange() {
    const currentState = this.state;

    if (currentState === this._lastState) {
      return;
    }

    this.emit(STATE_CHANGE_EVENT_NAMES[currentState]);
    this._lastState = currentState;
  }

  /**
   * Called when the socket emits it's "connect" event.
   */
  private onSocketConnect = () => {
    this.checkForStateChange();
  };

  /**
   * Called when the socket emits a "data" event.
   */
  private onSocketData = (data: Buffer | string) => {
    this.emit('data', data.toString());
  };

  /**
   * Called when the M1 closes the connection.
   */
  private onSocketEnd = () => {
    // Emitted when the other end of the socket sends a FIN packet,
    // thus ending the readable side of the socket.
    this.checkForStateChange();
  };

  /**
   * Called when the socket is completely closed.
   */
  private onSocketClose = (/* hadError: boolean */) => {
    // This is emitted right before a socket is destroyed.
    // Emitted once the socket is fully closed. The argument
    // hadError is a boolean which says if the socket was closed
    // due to a transmission error.
    this.setSocket(undefined);
  };

  /**
   * Called when the underlying socket emits an error event.
   */
  private onSocketError = (error: Error) => {
    // Emitted when an error occurs. The 'close' event will be called
    // directly following this event.
    if (this._socket) {
      this._socket.destroy(error);
    }

    this.emit('error', error);
  };

  /**
   * Called when the underlying socket has no activity within the `idleTimeout`
   * time. This will cause the socket to be disconnected.
   */
  private onSocketTimeout = () => {
    // Emitted if the socket times out from inactivity.
    // This is only to notify that the socket has been idle.
    // The user must manually close the connection.
    // The user must manually call socket.end() or socket.destroy() to end the connection.
    if (this._socket) {
      // TODO: call end and wait for a bit first before calling destroy?
      this._socket.destroy(new TimeoutError(this.options.idleTimeout));
    }
  };

  /**
   * Attempst to connect to the Elk M1
   * This should only be called when the connection is in a disconnected state,
   * otherwise it will fail with a {@link NotConnectableError}
   * @param timeout How long to wait for a connection to be established,
   *   after which the connect() call will fail.
   * @throws {NotConnectableError} if the socket is not currently disconnected.
   */
  async connect(timeout: number = this.options.connectTimeout): Promise<ElkSocketConnection> {
    if (this._socket) {
      throw new NotConnectableError(this.state, 'Must be disconnected to connect.');
    }

    let connectListener: () => void;
    let disconnectingListener: () => void;
    let errorListener: (error: Error) => void;
    let socket: Socket;

    return withTimeout<ElkSocketConnection>(
      timeout,
      new Promise((resolve, reject) => {
        connectListener = () => resolve();
        disconnectingListener = () => reject(new ConnectCancelledError());
        errorListener = error => reject(error);

        socket = createSocket(this.options);
        socket.on('connect', connectListener);
        this.on('error', errorListener);
        this.on('disconnecting', disconnectingListener);
        this.setSocket(socket);
      })
    )
      .catch(error => {
        socket.removeListener('connect', connectListener);
        this.removeListener('error', errorListener);
        this.removeListener('disconnecting', disconnectingListener);
        this.setSocket(undefined);
        throw error;
      })
      .then(() => {
        socket.removeListener('connect', connectListener);
        this.removeListener('error', errorListener);
        this.removeListener('disconnecting', disconnectingListener);
        return this;
      });
  }

  /**
   * Disconnect the current socket connection.
   * @param timeout How long to wait before forcefully disconnecting.
   */
  async disconnect(timeout: number = this.options.connectTimeout): Promise<ElkSocketConnection> {
    let closeListener: () => void;
    let socket: Socket;

    return withTimeout<ElkSocketConnection>(
      timeout,
      new Promise((resolve, reject) => {
        if (!this._socket) {
          // Already disconnected, just resolve.
          return resolve(this);
        }
        socket = this._socket;

        if (this.state === ElkConnectionState.Connecting) {
          // If we're in the process of connecting, emit a
          // `disconnecting` event that will cause the connect
          // promise to be rejected.
          this.emit('disconnecting');
          return resolve(this);
        }

        closeListener = () => resolve();
        socket.on('close', closeListener);
        socket.end();
      })
    )
      .catch(() => {
        socket.destroy();
      })
      .then(() => {
        if (closeListener) {
          socket.removeListener('close', closeListener);
        }
        return this;
      });
  }

  /**
   * Sends data to the Elk M1. Typically this is an Elk Message packet
   * (but can also be arbitrary data, as is the case when authenticating).
   */
  async write(data: string) {
    return new Promise((resolve, reject) => {
      if (!this._socket) {
        return reject(new WriteError(this.state, 'No socket available for writing.'));
      }

      if (!this._socket.writable) {
        return reject(new WriteError(this.state, 'Socket is not writeable'));
      }

      this._socket.write(data, 'ascii', () => resolve());
    });
  }
}

export default ElkSocketConnection;
