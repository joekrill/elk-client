import { Socket } from 'net';
import createSecureSocket from './createSocketSecure';
import createSocketInsecure from './createSocketInsecure';
import ElkSocketConnectionOptions from './ElkSocketConnectionOptions';

export default function createSocket(options: ElkSocketConnectionOptions): Socket {
  const socket = options.secure ? createSecureSocket(options) : createSocketInsecure(options);
  socket.setEncoding('ascii');
  socket.setTimeout(options.idleTimeout);
  return socket;
}
