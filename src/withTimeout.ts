import TimeoutError from './errors/TimeoutError';

/**
 * Wraps a promise in a new promise that will reject if the promise is not
 * resolved or rejected within the timeout provided.
 */
export default function withTimeout<T>(timeoutMs: number, promise: Promise<T>) {
  if (timeoutMs < 1) {
    return promise;
  }

  return new Promise<T>((resolve, reject) => {
    const timeout = setTimeout(() => reject(new TimeoutError(timeoutMs)), timeoutMs);
    promise
      .then(result => {
        clearTimeout(timeout);
        resolve(result);
      })
      .catch(error => {
        clearTimeout(timeout);
        reject(error);
      });
  });
}
