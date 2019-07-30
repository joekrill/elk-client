import { createSocket } from 'dgram';
import { EventEmitter } from 'events';
import decode from './decode';
import ElkDevice from './ElkDevice';
import ElkDeviceType from './ElkDeviceType';
import ElkDiscoveryOptions, { DEFAULT_DISCOVERY_OPTIONS } from './ElkDiscoveryOptions';

export const C1M1_DISCOVERY_ID = Buffer.from('C1M1ID', 'ascii');
export const M1XEP_DISCOVERY_ID = Buffer.from('XEPID', 'ascii');

/**
 * A client that can be used to discover Elk M1 devices on the
 * local network using UDP broadcasts.
 */
export default class ElkDiscoveryClient extends EventEmitter {
  private options: ElkDiscoveryOptions;

  constructor(initialOptions: Partial<ElkDiscoveryOptions> = {}) {
    super();
    this.options = { ...DEFAULT_DISCOVERY_OPTIONS, ...initialOptions };
  }

  /**
   * Starts the discovery process, resolving when complete (after the timeout),
   * or rejecting if an error occured.
   */
  start = async (): Promise<ElkDevice[]> => {
    return new Promise((resolve, reject) => {
      const { broadcastAddress, deviceTypes, port, timeout } = this.options;
      const socket = createSocket({ type: 'udp4', reuseAddr: true });
      let complete = false;
      const devices: { [x: string]: ElkDevice } = {};

      socket.on('message', (msg, rinfo) => {
        // Since the discovery requests are broadcast, we actually receive them as well,
        // so ignore those.
        if (msg.equals(C1M1_DISCOVERY_ID) || msg.equals(M1XEP_DISCOVERY_ID)) {
          return;
        }

        try {
          const device = decode(msg);
          devices[device.macAddress] = device;
          // devices.push(device);
          this.emit('found', device);
        } catch (err) {
          // Ignore unknown messages
          this.emit('unknownMessage', msg);
        }
      });

      socket.on('close', () => {
        if (!complete) {
          complete = true;
          this.emit('complete', devices);
          resolve(Object.values(devices));
        }
      });

      socket.on('error', error => {
        if (!complete) {
          complete = true;
          reject(error);
        }

        try {
          socket.close();
        } catch (err) {
          // Ignore this, socket was already closed.
        }
      });

      socket.bind(port, () => {
        socket.setBroadcast(true);

        if (!deviceTypes || deviceTypes.includes(ElkDeviceType.C1M1)) {
          socket.send(C1M1_DISCOVERY_ID, 0, C1M1_DISCOVERY_ID.length, port, broadcastAddress);
        }

        if (!deviceTypes || deviceTypes.includes(ElkDeviceType.M1XEP)) {
          socket.send(M1XEP_DISCOVERY_ID, 0, M1XEP_DISCOVERY_ID.length, port, broadcastAddress);
        }

        setTimeout(() => {
          socket.close();
        }, timeout);
      });
    });
  };
}
