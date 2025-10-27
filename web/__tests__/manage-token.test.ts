import { getToken } from '../lib/manageToken';
import { cookies } from 'next/headers';

jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}));

describe('manageToken', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock console methods to suppress logs in tests
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  test('should get token from cookies', async () => {
    const mockCookieStore = {
      get: jest.fn().mockReturnValue({ value: 'test-token' }),
    };
    (cookies as jest.Mock).mockReturnValue(mockCookieStore);

    const token = await getToken();
    expect(token).toEqual({ value: 'test-token' });
    expect(mockCookieStore.get).toHaveBeenCalledWith('auth_token');
  });

  test('should return null when no token is found', async () => {
    const mockCookieStore = {
      get: jest.fn().mockReturnValue(null),
    };
    (cookies as jest.Mock).mockReturnValue(mockCookieStore);

    const token = await getToken();
    expect(token).toBeNull();
    expect(mockCookieStore.get).toHaveBeenCalledWith('auth_token');
  });

  test('should handle cookie store errors', async () => {
    const mockCookieStore = {
      get: jest.fn().mockImplementation(() => {
        throw new Error('Cookie store error');
      }),
    };
    (cookies as jest.Mock).mockReturnValue(mockCookieStore);

    await expect(getToken()).rejects.toThrow('Cookie store error');
  });

  test('should handle invalid token format', async () => {
    const mockCookieStore = {
      get: jest.fn().mockReturnValue({ value: '' }),
    };
    (cookies as jest.Mock).mockReturnValue(mockCookieStore);

    const token = await getToken();
    expect(token).toEqual({ value: '' });
  });

  test('should handle undefined cookie store', async () => {
    (cookies as jest.Mock).mockReturnValue(undefined);

    await expect(getToken()).rejects.toThrow();
  });

  test('should handle malformed token value', async () => {
    const mockCookieStore = {
      get: jest.fn().mockReturnValue({ value: null }),
    };
    (cookies as jest.Mock).mockReturnValue(mockCookieStore);

    const token = await getToken();
    expect(token).toEqual({ value: null });
  });
});
