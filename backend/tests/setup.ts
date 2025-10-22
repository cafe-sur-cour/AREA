import 'reflect-metadata';

Object.defineProperty(global, 'import', {
  value: {
    meta: {
      url: 'file:///mock/path/to/module.js',
    },
  },
  writable: true,
});

global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
};
