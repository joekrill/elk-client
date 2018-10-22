import { mocked } from 'ts-jest/utils';
import { connect } from 'net';
import createSocketInsecure from './createSocketInsecure';

jest.mock('net');

describe('createSocketInsecure', () => {
  beforeEach(() => {
    mocked(connect).mockRestore();
  });

  describe('calls net.connect', () => {
    beforeEach(() => {
      createSocketInsecure({ host: 'host.example.com', port: 234 });
    });

    test('with the expected arguments', () => {
      expect(connect).toBeCalledWith(234, 'host.example.com');
    });
  });
});
