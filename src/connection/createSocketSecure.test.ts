import { connect } from 'tls';
import createSocketSecure from './createSocketSecure';

jest.mock('tls');

describe('createSocketSecure', () => {
  beforeEach(() => {
    (connect as jest.Mock<Function>).mockRestore();
  });

  describe('calls tls.connect', () => {
    beforeEach(() => {
      createSocketSecure({ host: 'host.example.com', port: 234 });
    });

    test('with the expected arguments', () => {
      expect(connect).toBeCalledWith(
        234,
        'host.example.com',
        expect.objectContaining({ rejectUnauthorized: false, secureProtocol: 'TLSv1_method' })
      );
    });
  });

  describe('overriding secureOptions', () => {
    beforeEach(() => {
      createSocketSecure({
        host: '123',
        port: 234,
        secureOptions: { rejectUnauthorized: true, secureProtocol: 'FOOBAR' }
      });
    });

    test('rejectUnauthorized can be override', () => {
      expect(connect).toBeCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({ rejectUnauthorized: true })
      );
    });

    test('secureProtocol can be overriden', () => {
      expect(connect).toBeCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({ secureProtocol: 'FOOBAR' })
      );
    });
  });
});
