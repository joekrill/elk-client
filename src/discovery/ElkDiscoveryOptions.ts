import ElkDeviceType from './ElkDeviceType';

export default interface ElkDiscoveryOptions {
  /**
   * The address to use to broadcast discovery requests
   */
  broadcastAddress: string;

  /**
   * The type of devices to discover. When not specified, a
   * discovery request should attempt to find any device
   * type.
   */
  deviceTypes?: ElkDeviceType[];

  /**
   * How long, in milliseconds, to wait for a response.
   */
  timeout: number;

  /**
   * The UDP port to use for discovery requests/responses.
   * Although this is configurable, my experience shows
   * only port 2362 works.
   */
  port: number;
}

export const DEFAULT_DISCOVERY_OPTIONS: ElkDiscoveryOptions = {
  // This is what ElkRP2 uses, but I've found local broadcast
  // addresses work as well (i.e.: 192.168.1.255)
  broadcastAddress: '255.255.255.255',

  // Attempt to discover all devices by default.
  deviceTypes: undefined,

  // Wait 5 seconds for responses.
  timeout: 5000,

  // ElkRP2 uses 2362 exclusively. Not sure if other ports will work.
  port: 2362,
};
