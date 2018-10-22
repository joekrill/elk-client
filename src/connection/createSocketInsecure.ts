import { connect, Socket } from 'net';

export default function createSocket({ host, port }: { host: string; port: number }): Socket {
  return connect(
    port,
    host
  );
}
