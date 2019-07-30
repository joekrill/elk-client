import ElkDeviceType from './ElkDeviceType';
import ElkDevice from './ElkDevice';

/**
 * Extracts a MAC address from 6 bytes of a data buffer
 * @param buffer The data buffer
 * @param startIndex The index within the buffer where the MAC address is specified.
 * @param [separator=":"] The separator character to use between octets
 */
export function extractMacAddress(buffer: Buffer, startIndex: number, separator: string = ':') {
  return Array.from(buffer.slice(startIndex, startIndex + 6))
    .map(value => value.toString(16).padStart(2, '0'))
    .join(separator);
}

/**
 * Extracts an IP address from 4 bytes of a data buffer
 * @param buffer The data buffer
 * @param startIndex The index within the buffer where the IP address is specified.
 */
export function extractIpAddress(buffer: Buffer, startIndex: number) {
  return Array.from(buffer.slice(startIndex, startIndex + 4))
    .map(value => value.toString(10))
    .join('.');
}

/**
 * Extracts a port number from 2 bytes of a data buffer
 * @param buffer The data buffer
 * @param startIndex The index within the buffer where the port is specified.
 */
export function extractPort(buffer: Buffer, startIndex: number) {
  return buffer[startIndex] * 256 + buffer[startIndex + 1];
}

/**
 * Decodes an `ElkDevice` configuration from a UDP discovery response.
 * @param data The UDP response data.
 */
export default function decode(data: Buffer): ElkDevice {
  // In both cases, the format of the response starts with:
  //
  //   `DDDDDMMMMMMIIIIPP`
  //
  // where:
  //   * `DDDDD` - A device type identifier (either "C1M1 " or "M1XEP"
  //   * `MMMMMM` - The MAC address
  //   * `IIII` - The IP address, where each byte is one octet
  //   * `PP` - The port to use to connect to the device
  //
  // The remaining bytes vary depending on the device type

  const identifier = data.slice(0, 5).toString();

  if (identifier === 'C1M1 ') {
    return {
      deviceType: ElkDeviceType.C1M1,
      macAddress: extractMacAddress(data, 5),
      ipAddress: extractIpAddress(data, 11),
      port: extractPort(data, 15),

      // For C1M1, the next 2 bytes represent the port to use
      // for secure connections.
      securePort: extractPort(data, 17),
    };
  } else if (identifier === 'M1XEP') {
    return {
      deviceType: ElkDeviceType.M1XEP,
      macAddress: extractMacAddress(data, 5),
      ipAddress: extractIpAddress(data, 11),
      port: extractPort(data, 15),

      // For M1XEP, there is a customizable 16-character
      // "name" that can be used to identify the device.
      name: data.toString('ascii', 17, 17 + 16).trim(),
    };
  }

  throw new Error('Unknown response recieved with ID: ' + identifier);
}
