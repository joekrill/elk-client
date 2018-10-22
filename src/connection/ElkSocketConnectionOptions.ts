import { TlsOptions } from 'tls';

/**
 * The options that can be passed to an ElkSocketConnection.
 */
export default interface ElkSocketConnectionOptions {
  /**
   * The port number to connect to.
   */
  port: number;

  /**
   * The host name or ip address of the Elk M1 to connect to.
   */
  host: string;

  /**
   * `true` to use a secure connection; `false` to use an insecure connection.
   */
  secure: boolean;

  /**
   * Additional options that can be overriden for secure connections.
   * These are passed directly to the `tls.connect` call.
   */
  secureOptions?: TlsOptions;

  /**
   * Number of milliseconds to kill a socket connection after it has been idle.
   * We should receive an ethernet text response ("XK") every 30 seconds, so
   * if we don't receive any responses for longer than that, likely there has been
   * a problem.
   */
  idleTimeout: number;

  /**
   * The default timeout when waiting to connect or disconnect.
   */
  connectTimeout: number;
}

/**
 * The default host name to use when one is not specified.
 *
 * 192.168.0.251 is the default IP address that the Elk M1
 * assigns to itself when it is not given one by a DHCP server
 * or when it is expicitly reset.
 */
export const DEFAULT_HOST = '192.168.0.251';

/**
 * The default port to connect to when using an insecure connection.
 */
export const DEFAULT_INSECURE_PORT = 2101;

/**
 * The default port to connect to when using a secure connection.
 */
export const DEFAULT_SECURE_PORT = 2601;

/**
 * The default connection options to use if `secure` === false
 */
export const DEFAULT_OPTIONS: ElkSocketConnectionOptions = {
  host: DEFAULT_HOST,
  port: DEFAULT_INSECURE_PORT,
  secure: false,
  idleTimeout: 60 * 1000,
  connectTimeout: 30 * 1000,
};

/**
 * The default connection options to use if `secure` === true
 */
export const SECURE_DEFAULT_OPTIONS: ElkSocketConnectionOptions = {
  ...DEFAULT_OPTIONS,
  secure: true,
  port: DEFAULT_SECURE_PORT,
};
