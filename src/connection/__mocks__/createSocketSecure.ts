export default jest.fn().mockImplementation(() => ({
  setEncoding: jest.fn(),
  setTimeout: jest.fn(),
}));
