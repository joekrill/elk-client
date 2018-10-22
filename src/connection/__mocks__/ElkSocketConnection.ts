import { EventEmitter } from 'events';
import ElkConnectionState from '../ElkConnectionState';
import ElkSocketConnectionOptions from '../ElkSocketConnectionOptions';

export const connect = jest.fn().mockResolvedValue({});
export const disconnect = jest.fn().mockResolvedValue({});
export const write = jest.fn().mockResolvedValue({});

class ElkSocketConnectionMock extends EventEmitter {
  static instances: ElkSocketConnectionMock[] = [];

  static mockClear() {
    ElkSocketConnectionMock.instances = [];
    connect.mockClear();
    disconnect.mockClear();
  }

  constructor(readonly initialOptions: Partial<ElkSocketConnectionOptions> = {}) {
    super();
    ElkSocketConnectionMock.instances.push(this);
  }

  connect = connect;
  disconnect = disconnect;
  write = write;
  state = ElkConnectionState.Disconnected;
};

export default ElkSocketConnectionMock;
