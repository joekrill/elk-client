import { ElkCommand, parse as parseElkResponse, EthernetModuleTest } from 'elk-message';
import ElkConnection from './connection/ElkConnection';
import ElkConnectionState from './connection/ElkConnectionState';
import ElkClientCommands from './ElkClientCommands';
import ElkClientState from './ElkClientState';
import AuthenticationFailedError, {
  AuthenticationFailedReason
} from './errors/AuthenticationFailedError';
import ElkSocketConnection from './connection/ElkSocketConnection';
import ElkClientOptions from './ElkClientOptions';
import withTimeout from './withTimeout';

/**
 * The control panel sends this when prompting for a username.
 */
const USERNAME_REQUEST = '\r\nUsername: ';

/**
 * The control panel sends this when prompting for a password.
 */
const PASSWORD_REQUEST = '\r\nPassword: ';

/**
 * The control panel sends this when logging in fails.
 */
const LOGIN_FAILURE = '\r\nUsername/Password not found.\r\n';

/**
 * The control panel sends this when logging in is susccessful
 */
const LOGIN_SUCCESSFUL = '\r\nElk-M1XEP: Login successful.\r\n';

/**
 * The default timeout for command responses when not specified.
 */
const DEFAULT_RESPONSE_TIMEOUT = 30 * 1000;

/**
 * The default connect timeout value when not specified.
 */
const DEFAULT_CONNECT_TIMEOUT = 60 * 1000;

class ElkClient extends ElkClientCommands {
  private _connection: ElkConnection;

  private _state: ElkClientState = ElkClientState.Disconnected;

  private _authenticated: boolean = false;

  constructor(readonly options: ElkClientOptions = { connection: {} }) {
    super();

    this._connection = new ElkSocketConnection(options.connection);
    this._connection.on('connected', this.onConnectionConnected);
    this._connection.on('disconnecting', this.onConnectionDisconnecting);
    this._connection.on('disconnected', this.onConnectionDisconnected);
    this._connection.on('data', this.onConnectionData);
    this._connection.on('error', this.onConnectionError);
  }

  /**
   * Gets the underlying ElkConnection.
   */
  get connection() {
    return this._connection;
  }

  /**
   * The default number of milliseconds to wait for a command
   * response before returning a timeout error.
   */
  get defaultTimeout() {
    return this.options.responseTimeout || DEFAULT_RESPONSE_TIMEOUT;
  }

  /**
   * True if the currently authenticated; otherwise, false.
   */
  get authenticated() {
    return this._authenticated;
  }

  /**
   * The client's current state.
   */
  get state() {
    return this._state;
  }

  /**
   * True if the client is in a ready state and is able
   * to communicate with the Elk M1.
   */
  get isReady() {
    return this._state === ElkClientState.Ready;
  }

  /**
   * True if the underlying connection is connected.
   */
  get isConnected() {
    return this._connection.state === ElkConnectionState.Connected;
  }

  /**
   * Attempts to connect (and authenticate, if needed) to the Elk M1.
   * Resolves when the client become ready, or rejects if there is an
   * error or if a ready state cannot be reached within the timeout
   * period.
   * @param timeoutMs How long to wait for the client to become
   *   ready.
   */
  async connect(
    timeoutMs: number = this.options.connectTimeout || DEFAULT_CONNECT_TIMEOUT
  ): Promise<ElkClient> {
    if (this.state === ElkClientState.Ready) {
      return Promise.resolve(this);
    }

    let errorListener: (error: Error) => void;
    let readyListener: () => void;

    return withTimeout<void>(
      timeoutMs,
      new Promise<void>((resolve, reject) => {
        readyListener = () => resolve();
        errorListener = error => reject(error);
        this.on('ready', readyListener);
        this.on('error', errorListener);
        if (this._connection.state === ElkConnectionState.Disconnecting) {
          // If we're in the process of closing the connection, wait for it
          // to close then try to connect.
          this._connection.disconnect().then(() => this._connection.connect());
        } else {
          this._connection.connect();
        }
      })
    )
      .catch(error => {
        this.removeListener('ready', readyListener);
        this.removeListener('error', errorListener);
        throw error;
      })
      .then(() => {
        this.removeListener('ready', readyListener);
        this.removeListener('error', errorListener);
        return this;
      });
  }

  /**
   * Disconnects the current connection and resolves
   * when completed.
   */
  async disconnect(): Promise<void> {
    return this._connection.disconnect().then(() => undefined);
  }

  /**
   * Sends a command to the Elk M1 control panel.
   */
  async sendCommand(command: ElkCommand, timeoutMs = this.defaultTimeout) {
    return withTimeout(timeoutMs, this._connection.write(command.raw).then(() => undefined));
  }

  private onReady(authenticated: boolean = false) {
    this._state = ElkClientState.Ready;
    if (authenticated) {
      this._authenticated = true;
      this.emit('authenticated');
    }
    this.emit('ready');
  }

  private onConnectionConnected = () => {
    if (!this.options.username) {
      // If no user name was supplied then send a command
      // to test the state of our connection. If we don't
      // need authentication, the onConnectionData callback
      // will see the response and mark the state as ready.
      // If we do need to authenticate, this should cause
      // the control panel to issue a failure message or request
      // authentication.
      this.getVersionNumber();
    }
  };

  private onConnectionDisconnecting = () => {
    this._state = ElkClientState.Disconnecting;
    this.emit('disconnecting');
  };

  private onConnectionDisconnected = () => {
    this._state = ElkClientState.Disconnected;
    this._authenticated = false;
    this.emit('disconnected');
  };

  private onConnectionError = (error: Error) => {
    this.emit('error', error);
  };

  private onConnectionData = (data: string) => {
    // TODO: Does each `data` chunk always contain complete
    // messages? Do we need to consider that we might get
    // a partial message? I've seen _multiple_ complete
    // messages in a single data chunk, but never half of
    // a message. (i.e. first half in one callback of the
    // event, and the other half in the next). It would
    // complicate the logic quite a bit so for now I'm
    // assuming this won't happen since I haven't seen it
    // in practice.

    // There are some "special" responses that the control panel
    // sends that are not in the standard message format.
    // Mostly related to authentication, but there are also some
    // cases where certain commands result in the panel sending
    // an "OK\r\n" message.
    switch (data) {
      case USERNAME_REQUEST: {
        if (!this.options.username) {
          this.emit(
            'error',
            new AuthenticationFailedError(
              AuthenticationFailedReason.MissingUsername,
              'Username was requested but none was provided.'
            )
          );
          this.disconnect();
          return;
        }

        this._state = ElkClientState.Authenticating;
        this.emit('authenticating');
        this._connection.write(this.options.username + '\r\n');
        break;
      }
      case PASSWORD_REQUEST: {
        if (!this.options.password) {
          this.emit(
            'error',
            new AuthenticationFailedError(
              AuthenticationFailedReason.MissingPassword,
              'Password was requested but none was provided.'
            )
          );
          this.disconnect();
          return;
        }
        this._connection.write(this.options.password + '\r\n');
        break;
      }
      case LOGIN_FAILURE: {
        this.emit(
          'error',
          new AuthenticationFailedError(
            AuthenticationFailedReason.InvalidCredentials,
            'Login failed, invalid username or password.'
          )
        );
        this.disconnect();
        return;
      }
      case LOGIN_SUCCESSFUL: {
        this.onReady(true);
        break;
      }
      default: {
        // We need to ignore any other responses while we're authenticating
        // because the username and password will be echoed back
        if (this._state !== ElkClientState.Authenticating) {
          if (!this.isReady && this.isConnected) {
            this.onReady();
          }

          // The M1 doesn't always send a single packet, so we need to check
          // for multiple packets at once.
          data.split(/\r\n|\r|\n/).forEach(packet => {
            if (packet) {
              if (packet == 'OK') {
                this.emit('ok');
              } else {
                this.emit('message', parseElkResponse(packet + '\r\n'));
              }
            }
          });
        }
      }
    }
  };
}

export default ElkClient;
