const net = jest.genMockFromModule('net');

net.connect = jest.fn((port, host, options) => {
  const socket = new net.Socket();
  return socket.connect();
});

module.exports = net;
