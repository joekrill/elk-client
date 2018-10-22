export default class TimeoutError extends Error {
  constructor(readonly timeoutMs: number, message?: string) {
    super(message);
    Object.setPrototypeOf(this, TimeoutError.prototype);
  }
}
