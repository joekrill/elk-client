import ElkClient from './ElkClient';
import ElkClientState from './ElkClientState';
import ElkSocketConnection from './connection/ElkSocketConnection';
import { ElkCommand, ArmingStatusRequest } from 'elk-message';
import TimeoutError from './errors/TimeoutError';
import { ElkConnectionState } from './connection';
import ElkSocketConnectionMock from './connection/__mocks__/ElkSocketConnection';
import { AuthenticationFailedError } from './errors';
import { AuthenticationFailedReason } from './errors/AuthenticationFailedError';

jest.mock('./connection/ElkSocketConnection');

describe('ElkClient', () => {
  afterEach(() => {
    ((ElkSocketConnection as unknown) as typeof ElkSocketConnectionMock).mockClear();
  });

  describe('initial state', () => {
    let client: ElkClient;

    beforeEach(() => {
      client = new ElkClient();
    });

    test('creates a connection', () => {
      expect((ElkSocketConnection as any).instances.length).toBe(1);
    });

    test('starts disconnected', () => {
      expect(client.state).toBe(ElkClientState.Disconnected);
    });

    test('timeout is 30 seconds', () => {
      expect(client.defaultTimeout).toBe(30000);
    });
  });

  describe('disconnect', () => {
    let client: ElkClient;

    beforeEach(() => {
      client = new ElkClient();
    });

    test('calls disconnect on the connection', async () => {
      expect.assertions(1);
      await client.disconnect();
      expect(client.connection.disconnect).toHaveBeenCalledTimes(1);
    });
  });

  describe('connect', () => {
    let client: ElkClient;

    beforeEach(() => {
      client = new ElkClient();
    });

    describe('when already ready', () => {
      beforeEach(() => {
        ((client.connection as unknown) as ElkSocketConnectionMock).state =
          ElkConnectionState.Connected;
        client.connection.emit('data', '\r\nElk-M1XEP: Login successful.\r\n');
      });

      test('resolves', async () => {
        expect.assertions(2);
        expect(client.state).toBe(ElkClientState.Ready);
        await client.connect();
        expect(client.connection.connect).not.toHaveBeenCalled();
      });
    });

    describe('when connection is disconnecting', () => {
      beforeEach(() => {
        ((client.connection as unknown) as ElkSocketConnectionMock).state =
          ElkConnectionState.Connected;
        client.connection.emit('disconnecting');
        ((client.connection as unknown) as ElkSocketConnectionMock).state =
          ElkConnectionState.Disconnecting;
        client.connection.connect = jest.fn(() => {
          // Force `client.connect()` to resolve.
          client.connection.emit('data', '\r\nElk-M1XEP: Login successful.\r\n');
        });
      });

      test('waits for disconnect first', async () => {
        expect.assertions(4);
        expect(client.state).toBe(ElkClientState.Disconnecting);
        expect(client.isConnected).toBe(false);
        await client.connect();
        expect(client.connection.disconnect).toHaveBeenCalled();
        expect(client.connection.connect).toHaveBeenCalled();
      });
    });

    describe('if not ready within timeout', () => {
      test('rejects with a TimeoutError', async () => {
        expect.assertions(1);
        try {
          await client.connect(1);
        } catch (error) {
          expect(error).toBeInstanceOf(TimeoutError);
        }
      });
    });

    describe('"error" emitted before "ready"', () => {
      let connectError: Error;

      beforeEach(() => {
        connectError = new Error('connection error');
        ((client.connection as unknown) as ElkSocketConnectionMock).state =
          ElkConnectionState.Connected;
      });

      test('rejects with the error', async () => {
        expect.assertions(1);
        setTimeout(() => {
          client.connection.emit('error', connectError);
        });
        try {
          await client.connect();
        } catch (error) {
          expect(error).toBe(connectError);
        }
      });
    });

    describe('becomes ready within timeout', () => {
      beforeEach(() => {
        ((client.connection as unknown) as ElkSocketConnectionMock).state =
          ElkConnectionState.Connected;
      });

      test('rejects with the error', async () => {
        expect.assertions(1);
        setTimeout(() => {
          client.connection.emit('data', '\r\nElk-M1XEP: Login successful.\r\n');
        });
        await client.connect();
        expect(client.state).toBe(ElkClientState.Ready);
      });
    });
  });

  describe('authentication', () => {
    let client: ElkClient;
    let mockSocketConnectionInstance: ElkSocketConnectionMock;

    describe('with no credentials', () => {
      beforeEach(() => {
        client = new ElkClient();
        mockSocketConnectionInstance = (client.connection as unknown) as ElkSocketConnectionMock;
        mockSocketConnectionInstance.state = ElkConnectionState.Connected;
      });

      describe('no credentials needed', () => {
        test('becomes ready', async () => {
          expect.assertions(2);
          setTimeout(() => {
            // No requests is ever made for username/password, but the panel
            // emits the ethernet test response.
            client.connection.emit('data', '16XK2636115020605110006F\r\n');
          });
          await client.connect();
          expect(client.state).toBe(ElkClientState.Ready);
          expect(client.authenticated).toBe(false);
        });

        test('requests the version number when connected', async () => {
          expect.assertions(1);
          setTimeout(() => {
            client.connection.emit('connected');
            client.connection.emit('data', 'OK\r\n');
          });
          await client.connect();
          expect(client.connection.write).toHaveBeenCalledWith('06vn0056\r\n');
        });
      });

      describe('credentials needed', () => {
        test('rejects with an authentication error', async () => {
          expect.assertions(2);
          setTimeout(() => {
            client.connection.emit('data', '\r\nUsername: ');
          });
          try {
            await client.connect();
          } catch (error) {
            expect(error).toBeInstanceOf(AuthenticationFailedError);
            expect((error as AuthenticationFailedError).reason).toBe(
              AuthenticationFailedReason.MissingUsername
            );
          }
        });
      });
    });

    describe('with username only', () => {
      beforeEach(() => {
        client = new ElkClient();
        mockSocketConnectionInstance = (client.connection as unknown) as ElkSocketConnectionMock;
        mockSocketConnectionInstance.state = ElkConnectionState.Connected;
      });

      describe('password requested', () => {
        test('rejects with an authentication error', async () => {
          expect.assertions(2);
          setTimeout(() => {
            client.connection.emit('data', '\r\nPassword: ');
          });
          try {
            await client.connect();
          } catch (error) {
            expect(error).toBeInstanceOf(AuthenticationFailedError);
            expect((error as AuthenticationFailedError).reason).toBe(
              AuthenticationFailedReason.MissingPassword
            );
          }
        });
      });
    });

    describe('with credentials', () => {
      beforeEach(() => {
        client = new ElkClient({ username: 'someone', password: 'supersecret' });
        mockSocketConnectionInstance = (client.connection as unknown) as ElkSocketConnectionMock;
        mockSocketConnectionInstance.state = ElkConnectionState.Connected;
      });

      afterEach(() => {
        client.removeAllListeners();
      });

      describe('when username requested', () => {
        let authenticatingEmitted = false;

        beforeEach(() => {
          client.connect();
          client.once('authenticating', () => {
            authenticatingEmitted = true;
          });
          mockSocketConnectionInstance.write.mockClear();
          client.connection.emit('data', '\r\nUsername: ');
        });

        test('sends the username', () => {
          expect(mockSocketConnectionInstance.write).toHaveBeenCalledWith('someone\r\n');
        });

        test('sets state', () => {
          expect(client.state).toBe(ElkClientState.Authenticating);
        });

        test('emits "authenticating"', () => {
          expect(authenticatingEmitted).toBe(true);
        });
      });

      describe('when password requested', () => {
        let authenticatingEmitted = false;

        beforeEach(() => {
          client.connect();
          client.once('authenticating', () => {
            authenticatingEmitted = true;
          });
          mockSocketConnectionInstance.write.mockClear();
          client.connection.emit('data', '\r\nPassword: ');
        });

        test('sends the password', () => {
          expect(mockSocketConnectionInstance.write).toHaveBeenCalledWith('supersecret\r\n');
        });
      });

      describe('when successful', () => {
        let authenticatedEmitted = false;

        beforeEach(() => {
          client.connect();
          client.once('authenticated', () => {
            authenticatedEmitted = true;
          });
          client.connection.emit('data', '\r\nElk-M1XEP: Login successful.\r\n');
        });

        test('sets state', () => {
          expect(client.state).toBe(ElkClientState.Ready);
        });

        test('sets `authenticated` to true', () => {
          expect(client.authenticated).toBe(true);
        });

        test('emits "authenticated"', () => {
          expect(authenticatedEmitted).toBe(true);
        });
      });

      describe('when not valid', () => {
        test('rejects with authentication error', async () => {
          expect.assertions(2);
          setTimeout(() => {
            client.connection.emit('data', '\r\nUsername/Password not found.\r\n');
          });

          try {
            await client.connect();
          } catch (error) {
            expect(error).toBeInstanceOf(AuthenticationFailedError);
            expect((error as AuthenticationFailedError).reason).toBe(
              AuthenticationFailedReason.InvalidCredentials
            );
          }
        });
      });
    });
  });

  describe('data received', () => {
    let client: ElkClient;

    beforeEach(() => {
      client = new ElkClient();
    });

    describe('when OK received', () => {
      let okEmitted = false;

      beforeEach(() => {
        client.connect();
        client.once('ok', () => {
          okEmitted = true;
        });
        client.connection.emit('data', 'OK\r\n');
      });

      test('emits "ok" event', () => {
        expect(okEmitted).toBe(true);
      });
    });
  });

  describe('sendCommand', () => {
    let client: ElkClient;
    let mockSocketConnectionInstance: ElkSocketConnectionMock;

    beforeEach(() => {
      client = new ElkClient();
      mockSocketConnectionInstance = (client.connection as unknown) as ElkSocketConnectionMock;
    });

    describe('succeeds', () => {
      let command: ElkCommand;

      beforeEach(() => {
        command = new ArmingStatusRequest();
        mockSocketConnectionInstance.write.mockClear();
      });

      test('calls write with the raw command string', async () => {
        expect.assertions(2);
        await client.sendCommand(command);
        expect(mockSocketConnectionInstance.write).toHaveBeenCalledTimes(1);
        expect(mockSocketConnectionInstance.write).toHaveBeenCalledWith(command.raw);
      });
    });

    describe('times out', () => {
      beforeEach(() => {
        mockSocketConnectionInstance.write.mockImplementation(() => new Promise(() => undefined));
      });

      test('calls write with the raw command string', async () => {
        expect.assertions(1);
        let command = new ArmingStatusRequest();
        try {
          await client.sendCommand(command, 1);
        } catch (error) {
          expect(error).toBeInstanceOf(TimeoutError);
        }
      });
    });

    describe('error', () => {
      let writeError: Error;

      beforeEach(() => {
        writeError = new Error('FOO!');
        mockSocketConnectionInstance.write.mockImplementation(
          () => new Promise((_, reject) => reject(writeError))
        );
      });

      test('rejects with the error generate by write()', async () => {
        expect.assertions(1);
        let command = new ArmingStatusRequest();
        try {
          await client.sendCommand(command);
        } catch (error) {
          expect(error).toBe(writeError);
        }
      });
    });
  });

  describe('connection disconnects', () => {
    let client: ElkClient;
    let disconnectedEmitted = false;

    beforeEach(() => {
      client = new ElkClient();
      client.once('disconnected', () => {
        disconnectedEmitted = true;
      });
      ((client.connection as unknown) as ElkSocketConnectionMock).state =
        ElkConnectionState.Connected;
      client.connect();
      client.connection.emit('data', '\r\nElk-M1XEP: Login successful.\r\n');
      client.connection.emit('disconnected');
    });

    test('emits "disconnected"', () => {
      expect(disconnectedEmitted).toBe(true);
    });

    test('reset `authenticated` to false', () => {
      expect(client.authenticated).toBe(false);
    });

    test('sets the state to Disconnected', () => {
      expect(client.state).toBe(ElkClientState.Disconnected);
    });
  });
});
