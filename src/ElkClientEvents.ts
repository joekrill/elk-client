import { ElkMessage } from 'elk-message';

/**
 * Emitted when a connection was successfully established. The client
 * may still need to authenticate before it becomes "ready".
 * @asMemberOf ElkClientEvents
 * @event
 */
declare function connected(): void;

/**
 * Emitted when authentication has begun. This is typically triggered
 * when the Elk M1 requests a username, after the "connected" event.
 * @asMemberOf ElkClientEvents
 * @event
 */
declare function authenticating(): void;

/**
 * Emitted when authentication has completed succesfully. This should
 * be followed by a "ready" event.
 * @asMemberOf ElkClientEvents
 * @event
 */
declare function authenticated(): void;

/**
 * Emitted when the client is ready to send/receive events. It means
 * we have successfully connected and authenticated (if a username and
 * password was supplied).
 * If no username was supplied, but the panel requires authentication,
 * this event may still be emitted, followed by an "error" event
 * indicating that authentication failed.
 * @asMemberOf ElkClientEvents
 * @event
 */
declare function ready(): void;

/**
 * Emitted whenever a message is recevied from the Elk M1.
 * @asMemberOf ElkClientEvents
 * @event message
 */
declare function message(message: ElkMessage): void;

/**
 * Emitted when the client receives an "OK" response the panel.
 * This is not a typical panel "message", but a special type of
 * response the panel sends in very specific cases.
 * @asMemberOf ElkClientEvents
 * @event
 */
declare function ok(): void;

/**
 * Emitted whenever an error occurs. The underlying connection will be
 * disconnected after this, if it hasn't already.
 * @asMemberOf ElkClientEvents
 * @event
 */
declare function error(error: Error): void;

/**
 * Emitted whenever the underlying connection disconnects. An error will
 * be included if it caused the disconnect.
 * @asMemberOf ElkClientEvents
 * @event
 */
declare function disconnected(error?: Error): void;

export default interface ElkClientEvents {
  addListener(event: 'connected', listener: typeof connected): this;
  addListener(event: 'authenticating', listener: typeof authenticating): this;
  addListener(event: 'authenticated', listener: typeof authenticated): this;
  addListener(event: 'ready', listener: typeof ready): this;
  addListener(event: 'message', listener: typeof message): this;
  addListener(event: 'ok', listener: typeof ok): this;
  addListener(event: 'error', listener: typeof error): this;
  addListener(event: 'disconnected', listener: typeof disconnected): this;

  removeListener(event: 'connected', listener: typeof connected): this;
  removeListener(event: 'authenticating', listener: typeof authenticating): this;
  removeListener(event: 'authenticated', listener: typeof authenticated): this;
  removeListener(event: 'ready', listener: typeof ready): this;
  removeListener(event: 'message', listener: typeof message): this;
  removeListener(event: 'ok', listener: typeof ok): this;
  removeListener(event: 'error', listener: typeof error): this;
  removeListener(event: 'disconnected', listener: typeof disconnected): this;

  on(event: 'connected', listener: typeof connected): this;
  on(event: 'authenticating', listener: typeof authenticating): this;
  on(event: 'authenticated', listener: typeof authenticated): this;
  on(event: 'ready', listener: typeof ready): this;
  on(event: 'message', listener: typeof message): this;
  on(event: 'ok', listener: typeof ok): this;
  on(event: 'error', listener: typeof error): this;
  on(event: 'disconnected', listener: typeof disconnected): this;

  once(event: 'connected', listener: typeof connected): this;
  once(event: 'authenticating', listener: typeof authenticating): this;
  once(event: 'authenticated', listener: typeof authenticated): this;
  once(event: 'ready', listener: typeof ready): this;
  once(event: 'message', listener: typeof message): this;
  once(event: 'ok', listener: typeof ok): this;
  once(event: 'error', listener: typeof error): this;
  once(event: 'disconnected', listener: typeof disconnected): this;

  prependListener(event: 'connected', listener: typeof connected): this;
  prependListener(event: 'authenticating', listener: typeof authenticating): this;
  prependListener(event: 'authenticated', listener: typeof authenticated): this;
  prependListener(event: 'ready', listener: typeof ready): this;
  prependListener(event: 'message', listener: typeof message): this;
  prependListener(event: 'ok', listener: typeof ok): this;
  prependListener(event: 'error', listener: typeof error): this;
  prependListener(event: 'disconnected', listener: typeof disconnected): this;

  prependOnceListener(event: 'connected', listener: typeof connected): this;
  prependOnceListener(event: 'authenticating', listener: typeof authenticating): this;
  prependOnceListener(event: 'authenticated', listener: typeof authenticated): this;
  prependOnceListener(event: 'ready', listener: typeof ready): this;
  prependOnceListener(event: 'message', listener: typeof message): this;
  prependOnceListener(event: 'ok', listener: typeof ok): this;
  prependOnceListener(event: 'error', listener: typeof error): this;
  prependOnceListener(event: 'disconnected', listener: typeof disconnected): this;

  emit(event: 'connected' | 'authenticating' | 'authenticated' | 'ready'): void;
  emit(event: 'message', message: ElkMessage): void;
  emit(event: 'ok', raw: string): void;
  emit(event: 'error', error: Error): void;
  emit(event: 'disconnected', error?: Error): void;
  emit(event: string | symbol, ...args: any[]): boolean;
}
