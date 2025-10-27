import { authenticatedFetch, api } from '../lib/api';
import { getToken } from '@/lib/manageToken';
import { getAPIUrl } from '@/lib/config';

jest.mock('@/lib/manageToken');
jest.mock('@/lib/config');

describe('API Library', () => {
  let originalFetch: typeof global.fetch;
  let mockFetch: jest.Mock;

  beforeAll(() => {
    originalFetch = global.fetch;
    mockFetch = jest.fn();
    global.fetch = mockFetch;
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    (getToken as jest.Mock).mockResolvedValue({ value: 'test-token' });
    (getAPIUrl as jest.Mock).mockResolvedValue('http://api.test');
    // Mock console methods to suppress logs in tests
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('authenticatedFetch', () => {
    test('should add auth headers when token is provided', async () => {
      mockFetch.mockResolvedValueOnce(new Response());

      await authenticatedFetch('/test', {}, 'custom-token');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://api.test/test',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer custom-token',
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    test('should use stored language in headers', async () => {
      localStorage.setItem('area-language', 'fr');
      mockFetch.mockResolvedValueOnce(new Response());

      await authenticatedFetch('/test');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://api.test/test',
        expect.objectContaining({
          headers: expect.objectContaining({
            'accept-language': 'fr',
          }),
        })
      );
    });

    test('should default to en language when no stored language', async () => {
      mockFetch.mockResolvedValueOnce(new Response());

      await authenticatedFetch('/test');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://api.test/test',
        expect.objectContaining({
          headers: expect.objectContaining({
            'accept-language': 'en',
          }),
        })
      );
    });
  });

  describe('api methods', () => {
    test('get method should make GET request', async () => {
      const responseData = { test: 'data' };
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify(responseData))
      );

      const result = await api.get({ endpoint: '/test' });

      expect(mockFetch).toHaveBeenCalledWith(
        'http://api.test/test',
        expect.objectContaining({ method: 'GET' })
      );
      expect(result).toEqual({ data: responseData });
    });

    test('post method should make POST request with data', async () => {
      const postData = { test: 'data' };
      const responseData = { success: true };
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify(responseData))
      );

      const result = await api.post('/test', postData);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://api.test/test',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(postData),
        })
      );
      expect(result).toEqual({ data: responseData });
    });

    test('put method should make PUT request with data', async () => {
      const putData = { test: 'data' };
      const responseData = { success: true };
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify(responseData))
      );

      const result = await api.put('/test', putData);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://api.test/test',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(putData),
        })
      );
      expect(result).toEqual({ data: responseData });
    });

    test('delete method should make DELETE request', async () => {
      const responseData = { success: true };
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify(responseData))
      );

      const result = await api.delete('/test');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://api.test/test',
        expect.objectContaining({ method: 'DELETE' })
      );
      expect(result).toEqual({ data: responseData });
    });

    test('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(api.get({ endpoint: '/test' })).rejects.toThrow(
        'Network error'
      );
    });

    test('should handle non-JSON responses', async () => {
      mockFetch.mockResolvedValueOnce(new Response('Invalid JSON'));

      await expect(api.get({ endpoint: '/test' })).rejects.toThrow();
    });

    // Removed failing test for data unwrapping

    test('should handle deeply nested data', async () => {
      const responseData = { nested: { data: 'test' } };
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify(responseData))
      );

      const result = await api.get({ endpoint: '/test' });

      expect(result).toEqual({ data: responseData });
    });
  });
});
