import { ElkSocketConnection, ElkConnectionState } from './';

describe('exports', () => {
  it('includes expected exports', () => {
    expect(typeof ElkSocketConnection).toBe('function');
    expect(typeof ElkConnectionState).toBe('object');
  });
});
