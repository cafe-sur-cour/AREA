import '@testing-library/jest-dom';
import {
  getSocketUrl,
  getAPIUrl,
  getBackendUrl,
  getFrontendUrl,
} from '@/lib/config';

// Mock getEnv to control env values used by config helpers
jest.mock('@/lib/load-env', () => ({
  getEnv: jest.fn(),
}));

import { getEnv } from '@/lib/load-env';

describe('Config helpers', () => {
  const OLD_ENV = process.env;
  const mockGetEnv = getEnv as jest.Mock;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV };
    mockGetEnv.mockResolvedValue({
      backendPort: '8080',
      backendUrl: 'http://backend.test:8080',
      frontendUrl: 'http://frontend.test:3000',
    });
    // Mock console methods to suppress logs in tests
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  describe('getSocketUrl', () => {
    it('returns backendUrl when DOCKER_ENV is true', async () => {
      process.env.DOCKER_ENV = 'true';
      const url = await getSocketUrl();
      expect(url).toBe('http://backend.test:8080');
    });

    it('returns localhost with port when window hostname is localhost', async () => {
      window.location.href = 'http://localhost';
      const url = await getSocketUrl();
      expect(url).toBe('http://localhost:8080');
    });

    // jsdom doesn't support full navigation; skip custom-hostname override in unit tests

    it('returns localhost with port on server when not in docker', async () => {
      const url = await getSocketUrl();
      expect(url).toBe('http://localhost:8080');
    });
  });

  describe('getAPIUrl', () => {
    it('returns backendUrl/api when DOCKER_ENV is true', async () => {
      process.env.DOCKER_ENV = 'true';
      const url = await getAPIUrl();
      expect(url).toBe('http://backend.test:8080/api');
    });

    // Default client env hostname is localhost in jsdom

    it('returns hostname with port and /api by default in client env', async () => {
      const url = await getAPIUrl();
      expect(url).toBe('http://localhost:8080/api');
    });
  });

  describe('getFrontendUrl', () => {
    it('returns the frontendUrl from env', async () => {
      const url = await getFrontendUrl();
      expect(url).toBe('http://frontend.test:3000');
    });

    it('returns default localhost if frontendUrl is not set', async () => {
      mockGetEnv.mockResolvedValue({
        backendPort: '8080',
        backendUrl: 'http://backend.test:8080',
        frontendUrl: null,
      });
      const url = await getFrontendUrl();
      expect(url).toBe('http://localhost:8081');
    });
  });

  describe('getBackendUrl', () => {
    it('returns localhost with port by default in client env', async () => {
      const url = await getBackendUrl();
      expect(url).toBe('http://localhost:8080');
    });

    it('returns localhost with port when window hostname is localhost', async () => {
      window.location.href = 'http://localhost';
      const url = await getBackendUrl();
      expect(url).toBe('http://localhost:8080');
    });

    // jsdom default hostname case is covered above
  });
});
