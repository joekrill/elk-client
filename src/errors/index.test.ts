import * as errors from './';

describe('exports', () => {
  it('includes expected exports', () => {
    expect(typeof errors.AuthenticationFailedError).toBe('function');
    expect(typeof errors.ConnectCancelledError).toBe('function');
    expect(typeof errors.NotConnectableError).toBe('function');
    expect(typeof errors.WriteError).toBe('function');
  });
});
