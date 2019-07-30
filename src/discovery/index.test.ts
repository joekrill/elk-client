import { ElkDeviceType, ElkDiscoveryClient } from './';

describe('exports', () => {
  it('includes expected exports', () => {
    expect(typeof ElkDeviceType).toBe('object');
    expect(typeof ElkDiscoveryClient).toBe('function');
  });
});
