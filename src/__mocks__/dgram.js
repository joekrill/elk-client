'use strict';
const EventEmitter = require('events');
const dgram = jest.genMockFromModule('dgram');

class DatagramSocketMock extends EventEmitter {
  bind(port, cb) {
    cb();
  }
  setBroadcast() {

  }
  send() {

  }
  close() {
    this.emit('close');
  }
}

dgram.__resetMockInstance = () => {
  dgram.__mockInstance = jest.fn().mockImplementation(() => new DatagramSocketMock())();
}
dgram.__resetMockInstance();

dgram.createSocket = () => dgram.__mockInstance;

module.exports = dgram;
