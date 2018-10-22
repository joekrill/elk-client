import { mocked } from 'ts-jest/utils';
import createSocketSecure from './createSocketSecure';
import createSocketInsecure from './createSocketInsecure';
import createSocket from './createSocket';

jest.mock('./createSocketSecure');
jest.mock('./createSocketInsecure');

describe('createSocket', () => {
  const defaultOptions = {
    host: 'm1.example.com',
    port: 2101,
    secure: false,
    idleTimeout: 1000,
    connectTimeout: 2000
  };

  beforeEach(() => {
    mocked(createSocketSecure).mockClear();
    mocked(createSocketInsecure).mockClear();
  });

  test('secure=false', () => {
    createSocket({ ...defaultOptions, secure: false });
    expect(createSocketSecure).not.toBeCalled();
    expect(createSocketInsecure).toBeCalled();
  });

  test('secure=true', () => {
    createSocket({ ...defaultOptions, secure: true });
    expect(createSocketInsecure).not.toBeCalled();
    expect(createSocketSecure).toBeCalled();
  });

  test('setEncoding', () => {
    const socket = createSocket({ ...defaultOptions, secure: false });
    expect(socket.setEncoding).toBeCalledWith('ascii');
  });

  test('setTimeout', () => {
    const socket = createSocket({ ...defaultOptions, secure: false });
    expect(socket.setTimeout).toBeCalledWith(defaultOptions.idleTimeout);
  });
});
