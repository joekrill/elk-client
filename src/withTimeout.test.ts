import withTimeout from './withTimeout';
import TimeoutError from './errors/TimeoutError';

describe('withTimeout', () => {
  test('never resolves', async () => {
    expect.assertions(1);
    try {
      await withTimeout(
        5,
        new Promise<void>(() => {
          /* will never resolve */
        })
      );
    } catch (err) {
      expect(err).toBeInstanceOf(TimeoutError);
    }
  });

  test('rejects after timeout', async () => {
    expect.assertions(1);
    try {
      await withTimeout(
        5,
        new Promise<void>(resolve => {
          setTimeout(() => resolve(), 10);
        })
      );
    } catch (err) {
      expect(err).toBeInstanceOf(TimeoutError);
    }
  });

  test('resolves before timeout', async () => {
    expect.assertions(1);
    const result = await withTimeout<string>(
      5,
      new Promise<string>(resolve => {
        setTimeout(() => resolve('foo'), 1);
      })
    );
    expect(result).toBe('foo');
  });

  test('rejects before timeout', async () => {
    expect.assertions(1);
    try {
      const result = await withTimeout<string>(
        5,
        new Promise<string>((_, reject) => {
          setTimeout(() => reject(new Error('FAIL!')), 1);
        })
      );
    } catch (error) {
      expect(error.message).toBe('FAIL!');
    }
  });
});
