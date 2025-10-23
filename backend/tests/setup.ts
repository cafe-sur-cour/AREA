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

process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '5432';
process.env.DB_NAME = 'test';
process.env.DB_USER = 'test';
process.env.DB_PASSWORD = 'test';
process.env.JWT_SECRET = 'test-secret';
process.env.ENCRYPTION_KEY = 'test-encryption-key-32-chars-long';
process.env.ADMIN_EMAIL = 'admin@test.com';
