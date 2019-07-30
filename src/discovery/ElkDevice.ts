import ElkDeviceType from './ElkDeviceType';

/**
 * Represents the configuration for a discovered Elk M1
 * network devices (a C1M1 or M1XEP).
 */
interface ElkDevice {
  /**
   * The type of device - a C1M1 communicator, or an M1XEP network device.
   */
  deviceType: ElkDeviceType;

  /**
   * The MAC address of the network device.
   */
  macAddress: string;

  /**
   * The device's local IP address
   */
  ipAddress: string;

  /**
   * An optional name (only for an M1XEP)
   */
  name?: string;

  /**
   * The (non-secure) port the device uses to communicate on.
   */
  port: number;

  /**
   * The secure port the device uses to communicate on.
   * For some reason it seems only the C1M1 sends this along, even though it is
   * configurable by the M1XEP (though I haven't been able to test with an actual
   * M1XEP devices, so this may be in the response somewhere).
   */
  securePort?: number;
}

export default ElkDevice;
