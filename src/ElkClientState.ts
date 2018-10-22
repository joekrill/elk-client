enum ElkClientState {
  /**
   * The client is disconnected.
   */
  Disconnected = 0,

  /**
   * The client is in the process of disconnecting.
   */
  Disconnecting = 1,

  /**
   * The client is in the process of connecting.
   */
  Connecting = 2,

  /**
   * The client is connected and in the process of authenticating.
   */
  Authenticating = 3,

  /**
   * The client has connected and is ready to issue commands and
   * receive responses.
   */
  Ready = 100
}

export default ElkClientState;
