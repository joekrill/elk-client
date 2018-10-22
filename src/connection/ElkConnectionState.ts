/**
 * Represents the current state of a connection to the Elk M1
 */
enum ElkConnectionState {
  /**
   * The connection is not connected.
   */
  Disconnected = 0,

  /**
   * In the process of connecting.
   */
  Connecting = 1,

  /**
   * Successfully connected.
   */
  Connected = 2,

  /**
   * The connection is still alive but in the process of disconnecting
   * (one side has issued a disconnection notice, but the other side may
   * node have responded yet.)
   */
  Disconnecting = 3
}

export default ElkConnectionState;
