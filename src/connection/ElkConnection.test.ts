import { STATE_CHANGE_EVENT_NAMES } from './ElkConnection';
import ElkConnectionState from './ElkConnectionState';

describe('STATE_CHANGE_EVENT_NAMES', () => {
  test('maps the expected connection states to event names', () => {
    expect(STATE_CHANGE_EVENT_NAMES[ElkConnectionState.Disconnected]).toBe('disconnected');
    expect(STATE_CHANGE_EVENT_NAMES[ElkConnectionState.Connecting]).toBe('connecting');
    expect(STATE_CHANGE_EVENT_NAMES[ElkConnectionState.Connected]).toBe('connected');
    expect(STATE_CHANGE_EVENT_NAMES[ElkConnectionState.Disconnecting]).toBe('disconnecting');
  });
});
