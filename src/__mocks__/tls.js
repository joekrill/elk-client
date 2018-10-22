const tls = jest.genMockFromModule('tls');

tls.connect = jest.fn((port, host, options, callback) => {
});

module.exports = tls;
