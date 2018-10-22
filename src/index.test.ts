import {
  ElkClient,
  ElkClientState,
  ElkConnectionState,
  ElkSocketConnection,
  AuthenticationFailedError,
  ConnectCancelledError,
  NotConnectableError,
  WriteError
} from './';

describe('exports', () => {
  it('includes expected exports', () => {
    expect(typeof ElkClient).toBe('function');
    expect(typeof ElkClientState).toBe('object');
    expect(typeof ElkConnectionState).toBe('object');
    expect(typeof ElkSocketConnection).toBe('function');
    expect(typeof AuthenticationFailedError).toBe('function');
    expect(typeof ConnectCancelledError).toBe('function');
    expect(typeof NotConnectableError).toBe('function');
    expect(typeof WriteError).toBe('function');
  });
});
