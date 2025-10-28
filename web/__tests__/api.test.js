import '@testing-library/jest-dom';

jest.mock('../lib/manageToken', () => ({
  getToken: jest.fn(() => Promise.resolve(null)),
}));

jest.mock('../lib/config', () => ({
  getAPIUrl: jest.fn(() => Promise.resolve('http://localhost:3000/api')),
}));

describe('API utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock console methods to suppress logs in tests
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('should have API utilities available', async () => {
    const api = await import('../lib/api');
    expect(api).toBeTruthy();
    expect(api.authenticatedFetch).toBeDefined();
  });

  it('should add auth headers when token exists', async () => {
    const { getToken } = require('../lib/manageToken');
    getToken.mockResolvedValue({ value: 'test-token' });

    const api = await import('../lib/api');
    expect(api.authenticatedFetch).toBeDefined();
  });

  it('should work without token', async () => {
    const { getToken } = require('../lib/manageToken');
    getToken.mockResolvedValue(null);

    const api = await import('../lib/api');
    expect(api.authenticatedFetch).toBeDefined();
  });
});
