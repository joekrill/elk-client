import { EventEmitter } from 'events';
import { mocked } from 'ts-jest/utils';
import createSocket from './createSocket';
import ElkConnectionState from './ElkConnectionState';
import ConnectCancelledError from '../errors/ConnectCancelledError';
import WriteError from '../errors/WriteError';
import NotConnectableError from '../errors/NotConnectableError';
import TimeoutError from '../errors/TimeoutError';
import ElkSocketConnection from './ElkSocketConnection';

jest.mock('net');
jest.mock('tls');
jest.mock('./createSocket.ts');

class SocketMock extends EventEmitter {
  connecting = false;
  destroyed = false;
  readable = false;
  writable = false;

  write = jest.fn((data, encoding, callback) => callback());

  setConnecting() {
    this.connecting = true;
    this.destroyed = false;
    this.readable = false;
    this.writable = false;
  }

  setConnected() {
    this.connecting = false;
    this.destroyed = false;
    this.readable = true;
    this.writable = true;
    this.emit('connect');
  }

  setError(error: Error) {
    this.emit('error', error);
    this.destroy();
  }

  setDisconnecting() {
    this.emit('end');
    this.connecting = false;
    this.destroyed = false;
    this.readable = true;
    this.writable = false;
  }

  end() {
    this.setDisconnecting();
  }

  destroy = jest.fn().mockImplementation(() => {
    this.connecting = false;
    this.destroyed = true;
    this.readable = false;
    this.writable = false;
    this.emit('close');
  });
}

function mockCreateSocketConnectsSuccessfully(waitMs = 5, modifier?: (mock: SocketMock) => void) {
  mocked(createSocket).mockImplementation(() => {
    const mock = new SocketMock();
    if (modifier) {
      modifier(mock);
    }
    mock.setConnecting();
    setTimeout(() => mock.setConnected(), waitMs);
    return mock;
  });
}

describe('ElkSocketConnection', () => {
  let connection: ElkSocketConnection;

  beforeEach(() => {
    mocked(createSocket).mockReset();
  });

  describe('construction', () => {
    describe('defaults', () => {
      beforeEach(() => {
        connection = new ElkSocketConnection();
      });

      test('non-secure', () => {
        expect(connection.options.secure).toBe(false);
      });

      test('default host', () => {
        expect(connection.options.host).toBe('192.168.0.251');
      });

      test('non-secure port', () => {
        expect(connection.options.port).toBe(2101);
      });

      test('state is Disconnected', () => {
        expect(connection.state).toBe(ElkConnectionState.Disconnected);
      });
    });

    describe('secure defaults', () => {
      beforeEach(() => {
        connection = new ElkSocketConnection({ secure: true });
      });

      test('is secure', () => {
        expect(connection.options.secure).toBe(true);
      });

      test('secure port', () => {
        expect(connection.options.port).toBe(2601);
      });
    });

    describe('custom options', () => {
      beforeEach(() => {
        connection = new ElkSocketConnection({
          secure: true,
          port: 1111,
          host: 'foobar',
          idleTimeout: 1,
          connectTimeout: 2,
          secureOptions: {
            rejectUnauthorized: true
          }
        });
      });

      test('custom port', () => {
        expect(connection.options.port).toBe(1111);
      });

      test('custom host', () => {
        expect(connection.options.host).toBe('foobar');
      });

      test('custom idleTimeout', () => {
        expect(connection.options.idleTimeout).toBe(1);
      });

      test('custom connectTimeout', () => {
        expect(connection.options.connectTimeout).toBe(2);
      });

      test('custom secureOptions', () => {
        const { secureOptions } = connection.options;
        expect(secureOptions).toBeDefined();
        expect(secureOptions && secureOptions.rejectUnauthorized).toBe(true);
      });
    });
  });

  describe('state', () => {
    let socketMock: SocketMock;

    beforeEach(() => {
      mockCreateSocketConnectsSuccessfully(0, mock => {
        socketMock = mock;
      });
      connection = new ElkSocketConnection();
    });

    describe('initially', () => {
      test('is Disconnected', async () => {
        expect(connection.state).toBe(ElkConnectionState.Disconnected);
      });
    });

    describe('when socket destroyed', () => {
      test('is Disconnected', async () => {
        await connection.connect();
        socketMock.destroyed = true;
        expect(connection.state).toBe(ElkConnectionState.Disconnected);
      });
    });

    describe('when socket connecting', () => {
      test('is Connecting', async () => {
        await connection.connect();
        socketMock.destroyed = false;
        socketMock.connecting = true;
        expect(connection.state).toBe(ElkConnectionState.Connecting);
      });
    });

    describe('when socket not readable', () => {
      test('is Disconnecting', async () => {
        await connection.connect();
        socketMock.readable = false;
        expect(connection.state).toBe(ElkConnectionState.Disconnecting);
      });
    });

    describe('when socket not writeable', () => {
      test('is Disconnecting', async () => {
        await connection.connect();
        socketMock.writable = false;
        expect(connection.state).toBe(ElkConnectionState.Disconnecting);
      });
    });

    describe('when socket is readable and writeable', () => {
      test('is Connected', async () => {
        await connection.connect();
        expect(connection.state).toBe(ElkConnectionState.Connected);
      });
    });
  });

  describe('connect', () => {
    describe('succeeds', () => {
      beforeEach(() => {
        mockCreateSocketConnectsSuccessfully();
        connection = new ElkSocketConnection();
      });

      test('initially sets state to Connecting', async () => {
        expect.assertions(1);
        let promise = connection.connect();
        expect(connection.state).toBe(ElkConnectionState.Connecting);
        await promise;
      });

      test('emits "connecting" then "connected"', async () => {
        expect.assertions(2);
        const emitSpy = jest.spyOn(connection, 'emit');
        const promise = connection.connect();
        expect(emitSpy).toHaveBeenCalledWith('connecting');
        await promise;
        expect(emitSpy).toHaveBeenCalledWith('connected');
      });

      test('resolves and shows state as Connected', async () => {
        expect.assertions(1);
        await connection.connect();
        expect(connection.state).toBe(ElkConnectionState.Connected);
      });

      test('fails if disconnect called before completed', async () => {
        expect.assertions(2);

        let connectResult;
        const connectPromise = connection
          .connect()
          .then(result => {
            connectResult = result;
          })
          .catch(error => {
            connectResult = error;
          });

        await connection.disconnect();
        await connectPromise;
        expect(connectResult).toBeInstanceOf(ConnectCancelledError);
        expect(connection.state).toBe(ElkConnectionState.Disconnected);
      });

      describe('called after connected', () => {
        test('it fails', async () => {
          expect.assertions(3);
          await connection.connect();
          expect(connection.state).toBe(ElkConnectionState.Connected);
          try {
            await connection.connect();
          } catch (error) {
            expect(error).toBeInstanceOf(NotConnectableError);
            expect(connection.state).toBe(ElkConnectionState.Connected);
          }
        });
      });
    });

    describe('fails', () => {
      beforeEach(() => {
        mocked(createSocket).mockImplementation(() => {
          const mock = new SocketMock();
          mock.setConnecting();
          setTimeout(() => mock.setError(new Error('Nope!')), 10);
          return mock;
        });
        connection = new ElkSocketConnection();
      });

      test('rejects with failure reason', async () => {
        expect.assertions(2);
        try {
          await connection.connect();
        } catch (error) {
          expect(error).toBeInstanceOf(Error);
          expect(connection.state).toBe(ElkConnectionState.Disconnected);
        }
      });

      test('emits "connecting" then "disconnected"', done => {
        expect.assertions(2);
        const emitSpy = jest.spyOn(connection, 'emit');
        const promise = connection.connect();
        expect(emitSpy).toHaveBeenCalledWith('connecting');
        promise.catch(() => {
          expect(emitSpy).toHaveBeenCalledWith('disconnected');
          done();
        });
      });
    });

    describe('times out', () => {
      beforeEach(() => {
        mockCreateSocketConnectsSuccessfully();
        mocked(createSocket).mockImplementation(() => {
          const mock = new SocketMock();
          mock.setConnecting();
          setTimeout(() => mock.setConnected(), 10);
          return mock;
        });
        connection = new ElkSocketConnection();
      });

      test('fails', async () => {
        expect.assertions(2);
        try {
          await connection.connect(1);
        } catch (error) {
          expect(error).toBeInstanceOf(TimeoutError);
          expect(connection.state).toBe(ElkConnectionState.Disconnected);
        }
      });
    });
  });

  describe('disconnect', () => {
    describe('when not connected', () => {
      beforeEach(() => {
        connection = new ElkSocketConnection();
      });

      it('resolves', async () => {
        expect.assertions(2);
        expect(connection.state).toBe(ElkConnectionState.Disconnected);
        await connection.disconnect();
        expect(connection.state).toBe(ElkConnectionState.Disconnected);
      });

      test('does not emit "disconnected"', async () => {
        expect.assertions(1);
        const emitSpy = jest.spyOn(connection, 'emit');
        await connection.disconnect();
        expect(emitSpy).not.toHaveBeenCalledWith('disconnected');
      });
    });

    describe('when connecting', () => {
      beforeEach(() => {
        mockCreateSocketConnectsSuccessfully();
        connection = new ElkSocketConnection();
      });

      it('cancels the connect and resolves', async () => {
        let connectError;
        expect.assertions(3);
        connection.connect().catch(error => {
          connectError = error;
        });
        expect(connection.state).toBe(ElkConnectionState.Connecting);
        await connection.disconnect();
        expect(connectError).toBeInstanceOf(ConnectCancelledError);
        expect(connection.state).toBe(ElkConnectionState.Disconnected);
      });

      test('emits "connecting" then "disconnected" but not "connected"', async () => {
        expect.assertions(3);
        const emitSpy = jest.spyOn(connection, 'emit');
        const connectPromise = connection.connect();
        expect(emitSpy).toHaveBeenCalledWith('connecting');
        await connection.disconnect();
        connectPromise.catch(() => undefined); // Ignore rejected promise, it's expected.
        expect(emitSpy).toHaveBeenCalledWith('disconnected');
        expect(emitSpy).not.toHaveBeenCalledWith('connected');
      });
    });

    describe('when connected', () => {
      beforeEach(() => {
        mockCreateSocketConnectsSuccessfully(10, mock => {
          mock.end = () => {
            setTimeout(() => {
              mock.destroy();
            }, 10);
          };
        });
        connection = new ElkSocketConnection();
      });

      it('disconnects and resolves', async () => {
        expect.assertions(3);
        expect(connection.state).toBe(ElkConnectionState.Disconnected);
        await connection.connect();
        expect(connection.state).toBe(ElkConnectionState.Connected);
        await connection.disconnect();
        expect(connection.state).toBe(ElkConnectionState.Disconnected);
      });

      it('emits "disconnected"', async () => {
        expect.assertions(1);
        const emitSpy = jest.spyOn(connection, 'emit');
        await connection.connect();
        emitSpy.mockClear();
        await connection.disconnect();
        expect(emitSpy).toHaveBeenCalledWith('disconnected');
      });
    });

    describe('when disconnecting', () => {
      let socketMock: SocketMock;
      beforeEach(() => {
        mockCreateSocketConnectsSuccessfully(10, mock => {
          socketMock = mock;
          mock.end = () => {
            setTimeout(() => {
              mock.destroy();
            }, 10);
          };
        });
        connection = new ElkSocketConnection();
      });

      it('resolves once the socket is closed', async () => {
        expect.assertions(2);
        await connection.connect();
        socketMock.setDisconnecting();
        expect(connection.state).toBe(ElkConnectionState.Disconnecting);
        await connection.disconnect();
        expect(connection.state).toBe(ElkConnectionState.Disconnected);
      });
    });

    describe('when times out', () => {
      let socketMock: SocketMock;
      beforeEach(() => {
        mockCreateSocketConnectsSuccessfully(10, mock => {
          socketMock = mock;
          mock.end = () => {
            setTimeout(() => {
              mock.destroy();
            }, 100);
          };
        });
        connection = new ElkSocketConnection();
      });

      it('forcefully destroy the socket', async () => {
        expect.assertions(3);
        await connection.connect();
        socketMock.setDisconnecting();
        expect(connection.state).toBe(ElkConnectionState.Disconnecting);
        await connection.disconnect(10);
        expect(connection.state).toBe(ElkConnectionState.Disconnected);
        expect(socketMock.destroy).toBeCalled();
      });
    });
  });

  describe('write', () => {
    describe('when not connected', () => {
      beforeEach(() => {
        connection = new ElkSocketConnection();
      });

      it('throws an error', async () => {
        expect.assertions(2);
        expect(connection.state).toBe(ElkConnectionState.Disconnected);
        try {
          await connection.write('foo');
        } catch (error) {
          expect(error).toBeInstanceOf(WriteError);
        }
      });
    });

    describe('when connecting', () => {
      let connectPromise: Promise<ElkSocketConnection>;

      beforeEach(() => {
        mockCreateSocketConnectsSuccessfully();
        connection = new ElkSocketConnection();
        connectPromise = connection.connect(5);
      });

      afterEach(async () => {
        connectPromise.catch(() => undefined);
      });

      it('cancels the connect and resolves', async () => {
        expect.assertions(2);
        expect(connection.state).toBe(ElkConnectionState.Connecting);
        try {
          await connection.write('foo');
        } catch (error) {
          expect(error).toBeInstanceOf(WriteError);
        }
      });
    });

    describe('when connected', () => {
      let mock: SocketMock;

      beforeEach(() => {
        mocked(createSocket).mockImplementation(() => {
          mock = new SocketMock();
          mock.setConnecting();
          setTimeout(() => mock.setConnected());
          return mock;
        });
        connection = new ElkSocketConnection();
      });

      it('writes to the socket using ascii encoding', async () => {
        expect.assertions(2);
        await connection.connect();
        expect(connection.state).toBe(ElkConnectionState.Connected);
        await connection.write('foo');
        expect(mock.write).toBeCalledWith('foo', 'ascii', expect.anything());
      });
    });
  });

  describe('when socket times out', () => {
    let socketMock: SocketMock;
    beforeEach(() => {
      mockCreateSocketConnectsSuccessfully(10, mock => {
        socketMock = mock;
        mock.end = () => {
          setTimeout(() => {
            mock.destroy();
          }, 100);
        };
      });
      connection = new ElkSocketConnection();
    });

    it('destroys the socket', async () => {
      expect.assertions(1);
      await connection.connect();
      socketMock.emit('timeout');
      expect(socketMock.destroy).toBeCalled();
    });
  });

  describe('when socket receives data', () => {
    let socketMock: SocketMock;
    beforeEach(() => {
      mockCreateSocketConnectsSuccessfully(0, mock => {
        socketMock = mock;
      });
      connection = new ElkSocketConnection();
    });

    it('emits it as a string', async () => {
      expect.assertions(2);
      const connectionEmitSpy = jest.spyOn(connection, 'emit');
      await connection.connect();
      const buffer = Buffer.from('somedata', 'ascii');
      const bufferSpy = jest.spyOn(buffer, 'toString');
      socketMock.emit('data', buffer);
      expect(bufferSpy).toHaveBeenCalled();
      expect(connectionEmitSpy).toHaveBeenCalledWith('data', 'somedata');
    });
  });

  describe('when an error is emitted', () => {
    let socketMock: SocketMock;
    let testError: Error;

    beforeEach(() => {
      mockCreateSocketConnectsSuccessfully(0, mock => {
        socketMock = mock;
      });
      connection = new ElkSocketConnection();
      testError = new Error('Something went wrong!');
    });

    it('destroys the socket and emits the error', async () => {
      expect.assertions(2);
      let errorEmitted;
      await connection.connect();
      connection.on('error', error => {
        errorEmitted = error;
      });
      socketMock.emit('error', testError);
      expect(socketMock.destroy).toHaveBeenCalled();
      expect(errorEmitted).toBe(testError);
    });
  });

  describe('when a timeout is emitted', () => {
    let socketMock: SocketMock;
    beforeEach(() => {
      mockCreateSocketConnectsSuccessfully(0, mock => {
        socketMock = mock;
      });
      connection = new ElkSocketConnection();
    });

    it('emits it as a string', async () => {
      expect.assertions(1);
      await connection.connect();
      socketMock.emit('timeout');
      expect(socketMock.destroy).toHaveBeenCalled();
    });
  });
});
