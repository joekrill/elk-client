import ElkConnectionState from './ElkConnectionState';

type StateChangeListener = (previousState: ElkConnectionState) => void;
type DisconnectedListener = (previousState: ElkConnectionState, error?: Error) => void;
type ErrorListener = (error: Error) => void;
type DataListener = (data: string) => void;

/**
 * A map of connection states to the name of the event that they emit
 * when the connection is changed to that state.
 */
export const STATE_CHANGE_EVENT_NAMES: { [P in ElkConnectionState]: string } = {
  [ElkConnectionState.Disconnected]: 'disconnected',
  [ElkConnectionState.Connecting]: 'connecting',
  [ElkConnectionState.Connected]: 'connected',
  [ElkConnectionState.Disconnecting]: 'disconnecting'
};

export default interface ElkConnection {
  /**
   * Emitted whenever the connection state has changed to 'connecting'
   * @event
   */
  addListener(event: 'connecting', listener: StateChangeListener): this;

  /**
   * Emitted whenever the connection state has changed to 'connected'
   * @event
   */
  addListener(event: 'connected', listener: StateChangeListener): this;

  /**
   * Emitted whenever the connection state has changed to 'disconnecting'
   * @event
   */
  addListener(event: 'disconnecting', listener: StateChangeListener): this;

  /**
   * Emitted whenever the connection state has changed.
   * @event
   */
  addListener(event: 'disconnected', listener: DisconnectedListener): this;

  /**
   * Emitted whenever an error occurs.
   * @event
   */
  addListener(event: 'error', listener: ErrorListener): this;

  /**
   * Emitted whenever data is received.
   * @event
   */
  addListener(event: 'data', listener: DataListener): this;

  removeListener(event: 'connecting', listener: StateChangeListener): this;
  removeListener(event: 'connected', listener: StateChangeListener): this;
  removeListener(event: 'disconnecting', listener: StateChangeListener): this;
  removeListener(event: 'disconnected', listener: DisconnectedListener): this;
  removeListener(event: 'error', listener: ErrorListener): this;
  removeListener(event: 'data', listener: DataListener): this;

  on(event: 'connecting', listener: StateChangeListener): this;
  on(event: 'connected', listener: StateChangeListener): this;
  on(event: 'disconnecting', listener: StateChangeListener): this;
  on(event: 'disconnected', listener: DisconnectedListener): this;
  on(event: 'error', listener: ErrorListener): this;
  on(event: 'data', listener: DataListener): this;

  once(event: 'connecting', listener: StateChangeListener): this;
  once(event: 'connected', listener: StateChangeListener): this;
  once(event: 'disconnecting', listener: StateChangeListener): this;
  once(event: 'disconnected', listener: DisconnectedListener): this;
  once(event: 'error', listener: ErrorListener): this;
  once(event: 'data', listener: DataListener): this;

  prependListener(event: 'connecting', listener: StateChangeListener): this;
  prependListener(event: 'connected', listener: StateChangeListener): this;
  prependListener(event: 'disconnecting', listener: StateChangeListener): this;
  prependListener(event: 'disconnected', listener: DisconnectedListener): this;
  prependListener(event: 'error', listener: ErrorListener): this;
  prependListener(event: 'data', listener: DataListener): this;

  prependOnceListener(event: 'connecting', listener: StateChangeListener): this;
  prependOnceListener(event: 'connected', listener: StateChangeListener): this;
  prependOnceListener(event: 'disconnecting', listener: StateChangeListener): this;
  prependOnceListener(event: 'disconnected', listener: DisconnectedListener): this;
  prependOnceListener(event: 'error', listener: ErrorListener): this;
  prependOnceListener(event: 'data', listener: DataListener): this;

  emit(event: string | symbol, ...args: any[]): boolean;
  emit(event: 'connecting', previousState: ElkConnectionState): void;
  emit(event: 'connected', previousState: ElkConnectionState): void;
  emit(event: 'disconnecting', previousState: ElkConnectionState): void;
  emit(event: 'disconnected', previousState: ElkConnectionState, error?: Error): void;
  emit(event: 'error', error: Error): void;
  emit(event: 'data', data: string): void;

  readonly state: ElkConnectionState;
  connect(): Promise<ElkConnection>;
  disconnect(): Promise<ElkConnection>;
  write(data: string): Promise<{}>;
}
