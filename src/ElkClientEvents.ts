import { ElkMessage } from 'elk-message';

type MessageListener = (message: ElkMessage) => void;
type DisconnectedListener = (error?: Error) => void;
type ErrorListener = (error: Error) => void;
type DataListener = (data: string) => void;
type Listener = () => void;

export default interface ElkClientEvents {
  /**
   * Emitted whenever a message is recevied
   * @event
   */
  addListener(event: 'message', listener: MessageListener): this;

  /**
   * Emitted when authentication has begun
   */
  addListener(event: 'authenticating', listener: Listener): this;

  /**
   *
   * Emitted when successfully authenticated
   */
  addListener(event: 'authenticated', listener: Listener): this;

  /**
   * Emitted whenever the underlying connection disconnects
   * @event
   */
  addListener(event: 'disconnected', listener: DisconnectedListener): this;

  /**
   * Emitted whenever an error occurs.
   * @event
   */
  addListener(event: 'error', listener: ErrorListener): this;

  /**
   *
   * Emitted when the client receives an "OK" response the panel.
   */
  addListener(event: 'ok', listener: DataListener): this;

  removeListener(event: 'message', listener: MessageListener): this;
  removeListener(event: 'authenticating', listener: Listener): this;
  removeListener(event: 'authenticated', listener: Listener): this;
  removeListener(event: 'disconnected', listener: DisconnectedListener): this;
  removeListener(event: 'error', listener: ErrorListener): this;
  removeListener(event: 'ok', listener: DataListener): this;

  on(event: 'message', listener: MessageListener): this;
  on(event: 'authenticating', listener: Listener): this;
  on(event: 'authenticated', listener: Listener): this;
  on(event: 'disconnected', listener: DisconnectedListener): this;
  on(event: 'error', listener: ErrorListener): this;
  on(event: 'ok', listener: DataListener): this;

  once(event: 'message', listener: MessageListener): this;
  once(event: 'authenticating', listener: Listener): this;
  once(event: 'authenticated', listener: Listener): this;
  once(event: 'disconnected', listener: DisconnectedListener): this;
  once(event: 'error', listener: ErrorListener): this;
  once(event: 'ok', listener: DataListener): this;

  prependListener(event: 'message', listener: MessageListener): this;
  prependListener(event: 'authenticating', listener: Listener): this;
  prependListener(event: 'authenticated', listener: Listener): this;
  prependListener(event: 'disconnected', listener: DisconnectedListener): this;
  prependListener(event: 'error', listener: ErrorListener): this;
  prependListener(event: 'ok', listener: DataListener): this;

  prependOnceListener(event: 'message', listener: MessageListener): this;
  prependOnceListener(event: 'authenticating', listener: Listener): this;
  prependOnceListener(event: 'authenticated', listener: Listener): this;
  prependOnceListener(event: 'disconnected', listener: DisconnectedListener): this;
  prependOnceListener(event: 'error', listener: ErrorListener): this;
  prependOnceListener(event: 'ok', listener: DataListener): this;

  emit(event: string | symbol, ...args: any[]): boolean;
  emit(event: 'message', message: ElkMessage): void;
  emit(event: 'authenticating'): void;
  emit(event: 'authenticated'): void;
  emit(event: 'disconnected', error?: Error): void;
  emit(event: 'error', error: Error): void;
  emit(event: 'ok', raw: string): void;
}
