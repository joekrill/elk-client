import { connect, TLSSocket, ConnectionOptions } from 'tls';

export default function createSecureSocket(options: {
  host: string;
  port: number;
  secureOptions?: ConnectionOptions;
}): TLSSocket {
  return connect(
    options.port,
    options.host,
    {
      rejectUnauthorized: false,
      secureProtocol: 'TLSv1_method',
      ...options.secureOptions
    }
  );
}
