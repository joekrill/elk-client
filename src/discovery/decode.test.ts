import decode, { extractMacAddress, extractIpAddress, extractPort } from './decode';
import ElkDeviceType from './ElkDeviceType';

describe('extractMacAddress', () => {
  const macTest = Buffer.from([0x01, 0x23, 0x45, 0x67, 0x89, 0xab]);
  const allZeros = Buffer.from([0, 0, 0, 0, 0, 0]);
  const allFfs = Buffer.from([255, 255, 255, 255, 255, 255]);

  it('extracts the expected values', () => {
    expect(extractMacAddress(macTest, 0)).toBe('01:23:45:67:89:ab');
    expect(extractMacAddress(allZeros, 0)).toBe('00:00:00:00:00:00');
    expect(extractMacAddress(allFfs, 0)).toBe('ff:ff:ff:ff:ff:ff');
  });

  it('uses the specified separator', () => {
    expect(extractMacAddress(macTest, 0, '-')).toBe('01-23-45-67-89-ab');
  });

  it('works without a separator', () => {
    expect(extractMacAddress(macTest, 0, '')).toBe('0123456789ab');
  });

  it('extracts from the middle of a buffer', () => {
    const start = Buffer.from([1, 2, 3, 4, 5]);
    const end = Buffer.from([6, 7, 8, 9]);
    const data = Buffer.concat([start, macTest, end]);
    expect(extractMacAddress(data, start.length)).toBe('01:23:45:67:89:ab');
  });
});

describe('extractIpAddress', () => {
  const privateIp1 = Buffer.from([192, 168, 1, 30]);
  const privateIp2 = Buffer.from([10, 10, 10, 2]);
  const linkLocalIp = Buffer.from([169, 254, 0, 0]);
  const broadcastIp = Buffer.from([255, 255, 255, 255]);

  it('extracts the expected values', () => {
    expect(extractIpAddress(privateIp1, 0)).toBe('192.168.1.30');
    expect(extractIpAddress(privateIp2, 0)).toBe('10.10.10.2');
    expect(extractIpAddress(linkLocalIp, 0)).toBe('169.254.0.0');
    expect(extractIpAddress(broadcastIp, 0)).toBe('255.255.255.255');
  });

  it('extracts from the middle of a buffer', () => {
    const start = Buffer.from([1, 2, 3, 4, 5]);
    const end = Buffer.from([6, 7, 8, 9]);
    expect(extractIpAddress(Buffer.concat([start, privateIp1, end]), start.length)).toBe(
      '192.168.1.30'
    );
    expect(extractIpAddress(Buffer.concat([start, privateIp2, end]), start.length)).toBe(
      '10.10.10.2'
    );
    expect(extractIpAddress(Buffer.concat([start, linkLocalIp, end]), start.length)).toBe(
      '169.254.0.0'
    );
    expect(extractIpAddress(Buffer.concat([start, broadcastIp, end]), start.length)).toBe(
      '255.255.255.255'
    );
  });
});

describe('extractPort', () => {
  const p0 = Buffer.from([0, 0]);
  const p1 = Buffer.from([0, 1]);
  const p2101 = Buffer.from([8, 53]);
  const p2601 = Buffer.from([10, 41]);
  const p65535 = Buffer.from([255, 255]);

  it('extracts the expected values', () => {
    expect(extractPort(p0, 0)).toBe(0);
    expect(extractPort(p1, 0)).toBe(1);
    expect(extractPort(p2101, 0)).toBe(2101);
    expect(extractPort(p2601, 0)).toBe(2601);
    expect(extractPort(p65535, 0)).toBe(65535);
  });

  it('extracts from the middle of a buffer', () => {
    const start = Buffer.from([1, 2, 3, 4, 5]);
    const end = Buffer.from([6, 7, 8, 9]);
    expect(extractPort(Buffer.concat([start, p0, end]), start.length)).toBe(0);
    expect(extractPort(Buffer.concat([start, p1, end]), start.length)).toBe(1);
    expect(extractPort(Buffer.concat([start, p2101, end]), start.length)).toBe(2101);
    expect(extractPort(Buffer.concat([start, p2601, end]), start.length)).toBe(2601);
    expect(extractPort(Buffer.concat([start, p65535, end]), start.length)).toBe(65535);
  });
});

describe('decode', () => {
  describe('C1M1', () => {
    // prettier-ignore
    const c1m1 = Buffer.from([
      67, 49, 77, 49, 32, // ID
      0x77, 0x88, 0x99, 0xaa, 0xbb, 0xcc, // MAC
      192, 168, 1, 100, // IP
      8, 53, // port
      22, 33, // secure port
      67, 49, 77, 49, 32, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, // ignored
    ]);

    it('returns the expected device', () => {
      expect(decode(c1m1)).toMatchObject({
        deviceType: ElkDeviceType.C1M1,
        macAddress: '77:88:99:aa:bb:cc',
        ipAddress: '192.168.1.100',
        port: 2101,
        securePort: 5665,
      });
    });
  });

  describe('M1XEP', () => {
    // prettier-ignore
    const m1xep = Buffer.from([
      77, 49, 88 , 69, 80, // ID
      0x12, 0x34, 0x56, 0xab, 0xcd, 0xef, // MAC
      10, 10, 1, 202, // IP
      3, 9, // port
      73, 32, 97, 109, 32, 97, 110, 32, 77, 49, 88, 69, 80, 33, 32, 32, // name
      0, 0, 0, 0, 0, 0, 0, 0, 0, // unused
    ]);

    it('returns the expected device', () => {
      expect(decode(m1xep)).toMatchObject({
        deviceType: ElkDeviceType.M1XEP,
        macAddress: '12:34:56:ab:cd:ef',
        ipAddress: '10.10.1.202',
        name: 'I am an M1XEP!',
        port: 777,
      });
    });
  });

  describe('Unknown', () => {
    const invalid = Buffer.from([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);

    it('throws an error', () => {
      expect(() => decode(invalid)).toThrowError('Unknown');
    });
  });
});
