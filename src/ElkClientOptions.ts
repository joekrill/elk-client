import { ElkSocketConnectionOptions } from './connection';

interface ElkClientOptions {
  connection?: Partial<ElkSocketConnectionOptions>;

  username?: string;

  password?: string;

  /**
   * The default timeout used when sending commands
   * and waiting for a response.
   */
  responseTimeout?: number;

  /**
   * The default timeout when calling connect(). This
   * includes the time it takes to authenticate.
   */
  connectTimeout?: number;
}

export default ElkClientOptions;
