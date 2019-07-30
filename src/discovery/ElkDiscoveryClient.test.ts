import ElkDiscoveryClient, { C1M1_DISCOVERY_ID, M1XEP_DISCOVERY_ID } from './ElkDiscoveryClient';
import ElkDeviceType from './ElkDeviceType';
import { DEFAULT_DISCOVERY_OPTIONS } from './ElkDiscoveryOptions';
jest.mock('dgram');

// prettier-ignore
const C1M1_MSG = Buffer.from([
  67, 49, 77, 49, 32, // ID
  0x77, 0x88, 0x99, 0xaa, 0xbb, 0xcc, // MAC
  192, 168, 1, 100, // IP
  8, 53, // port
  22, 33, // secure port
  67, 49, 77, 49, 32, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1,
]);

// prettier-ignore
const M1XEP_MSG = Buffer.from([
  77, 49, 88 , 69, 80, // ID
  0x12, 0x34, 0x56, 0xab, 0xcd, 0xef, // MAC
  10, 10, 1, 202, // IP
  3, 9, // port
  73, 32, 97, 109, 32, 97, 110, 32, 77, 49, 88, 69, 80, 33, 32, 32, // name
  0, 0, 0, 0, 0, 0, 0, 0, 0, // unused
]);

describe('ElkDiscoveryClient', () => {
  let client: ElkDiscoveryClient;
  let dgramMockInstance: any;

  beforeEach(() => {
    jest.useFakeTimers();
    dgramMockInstance = require('dgram').__mockInstance;
  });

  afterEach(() => {
    require('dgram').__resetMockInstance();
  });

  describe('with defaults', () => {
    beforeEach(() => {
      client = new ElkDiscoveryClient();
    });

    it('resolves after default timeout', async () => {
      expect.assertions(1);
      const result = client.start();
      jest.advanceTimersByTime(5000);
      const devices = await result;
      expect(devices.length).toBe(0);
    });

    it('requests all device types', async () => {
      expect.assertions(3);
      const sendMock = jest.fn();
      dgramMockInstance.send = sendMock;
      const result = client.start();
      jest.advanceTimersByTime(5000);
      const devices = await result;
      expect(sendMock.mock.calls.length).toBe(2);
      expect(sendMock).toBeCalledWith(
        C1M1_DISCOVERY_ID,
        0,
        C1M1_DISCOVERY_ID.length,
        DEFAULT_DISCOVERY_OPTIONS.port,
        DEFAULT_DISCOVERY_OPTIONS.broadcastAddress
      );
      expect(sendMock).toBeCalledWith(
        M1XEP_DISCOVERY_ID,
        0,
        M1XEP_DISCOVERY_ID.length,
        DEFAULT_DISCOVERY_OPTIONS.port,
        DEFAULT_DISCOVERY_OPTIONS.broadcastAddress
      );
    });

    it('reports devices', async () => {
      expect.assertions(2);
      const result = client.start();
      dgramMockInstance.emit('message', C1M1_MSG);
      dgramMockInstance.emit('message', M1XEP_MSG);
      jest.advanceTimersByTime(5000);
      const devices = await result;
      // expect(devices.length).toBe(2);
      expect(devices).toContainEqual({
        deviceType: ElkDeviceType.M1XEP,
        macAddress: '12:34:56:ab:cd:ef',
        ipAddress: '10.10.1.202',
        name: 'I am an M1XEP!',
        port: 777,
      });
      expect(devices).toContainEqual({
        deviceType: ElkDeviceType.C1M1,
        macAddress: '77:88:99:aa:bb:cc',
        ipAddress: '192.168.1.100',
        port: 2101,
        securePort: 5665,
      });
    });

    it('does not report duplicate devices', async () => {
      expect.assertions(1);
      const result = client.start();
      dgramMockInstance.emit('message', M1XEP_MSG);
      dgramMockInstance.emit('message', C1M1_MSG);
      dgramMockInstance.emit('message', M1XEP_MSG);
      jest.advanceTimersByTime(5000);
      const devices = await result;
      expect(devices.length).toBe(2);
    });

    it('ignores invalid messages', async () => {
      expect.assertions(1);
      const result = client.start();
      dgramMockInstance.emit('message', M1XEP_MSG);
      dgramMockInstance.emit('message', C1M1_MSG);
      dgramMockInstance.emit('message', Buffer.from([0, 0, 0, 0, 0, 0, 0]));
      jest.advanceTimersByTime(5000);
      const devices = await result;
      expect(devices.length).toBe(2);
    });

    it("ignores it's own discovery messages", async () => {
      expect.assertions(1);
      const result = client.start();
      dgramMockInstance.emit('message', C1M1_MSG);
      dgramMockInstance.emit('message', Buffer.from('C1M1ID', 'ascii'));
      jest.advanceTimersByTime(5000);
      const devices = await result;
      expect(devices.length).toBe(1);
    });

    it('rejects on an error', async () => {
      expect.assertions(1);
      const result = client.start();
      const fakeError = new Error('oops');
      dgramMockInstance.emit('error', fakeError);
      try {
        await result;
      } catch (err) {
        expect(err).toBe(fakeError);
      }
    });

    it('does not reject if already resolved', async () => {
      expect.assertions(1);
      const result = client.start();
      dgramMockInstance.emit('close');
      dgramMockInstance.emit('error', new Error('oops'));
      const devices = await result;
      expect(devices.length).toBe(0);
    });
  });

  describe('with only M1XEP discovery', () => {
    beforeEach(() => {
      client = new ElkDiscoveryClient({ deviceTypes: [ElkDeviceType.M1XEP] });
    });

    it('requests only M1XEP device types', async () => {
      expect.assertions(2);
      const sendMock = jest.fn();
      dgramMockInstance.send = sendMock;
      const result = client.start();
      jest.advanceTimersByTime(5000);
      const devices = await result;
      expect(sendMock.mock.calls.length).toBe(1);
      expect(sendMock).toBeCalledWith(
        M1XEP_DISCOVERY_ID,
        0,
        M1XEP_DISCOVERY_ID.length,
        DEFAULT_DISCOVERY_OPTIONS.port,
        DEFAULT_DISCOVERY_OPTIONS.broadcastAddress
      );
    });
  });

  describe('with only C1M1 discovery', () => {
    beforeEach(() => {
      client = new ElkDiscoveryClient({ deviceTypes: [ElkDeviceType.C1M1] });
    });

    it('requests only M1XEP device types', async () => {
      expect.assertions(2);
      const sendMock = jest.fn();
      dgramMockInstance.send = sendMock;
      const result = client.start();
      jest.advanceTimersByTime(5000);
      const devices = await result;
      expect(sendMock.mock.calls.length).toBe(1);
      expect(sendMock).toBeCalledWith(
        C1M1_DISCOVERY_ID,
        0,
        C1M1_DISCOVERY_ID.length,
        DEFAULT_DISCOVERY_OPTIONS.port,
        DEFAULT_DISCOVERY_OPTIONS.broadcastAddress
      );
    });
  });
});
