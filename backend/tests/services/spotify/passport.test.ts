import passport from 'passport';
import jwt from 'jsonwebtoken';

// Mock OAuth2Strategy before importing
let mockStrategyCallback: any;
const MockOAuth2Strategy = jest.fn((options, callback) => {
  mockStrategyCallback = callback;
  return {};
});
jest.mock('passport-oauth2', () => ({
  Strategy: MockOAuth2Strategy,
}));

// Mock adminjs before any imports that depend on it
jest.mock('adminjs', () => ({
  default: jest.fn(),
  ComponentLoader: jest.fn(),
}));

// Mock adminJs.ts to avoid importing AdminJS packages
jest.mock('../../../src/config/adminJs', () => ({
  setupAdminPanel: jest.fn(),
}));

// Mock the entire index.ts to prevent server startup
jest.mock('../../../index', () => ({
  JWT_SECRET: 'test-secret',
  encryption: {
    encrypt: jest.fn(data => `encrypted_${data}`),
    decrypt: jest.fn(data => data.replace('encrypted_', '')),
  },
}));

// Mock node-fetch before importing oauth.ts to avoid ESM issues
const mockFetch = jest.fn() as jest.MockedFunction<typeof fetch>;
jest.mock('node-fetch', () => mockFetch);
global.fetch = mockFetch;

// Set environment variables before importing to avoid instantiation errors
process.env.SERVICE_SPOTIFY_CLIENT_ID = 'test-client-id';
process.env.SERVICE_SPOTIFY_CLIENT_SECRET = 'test-client-secret';
process.env.SERVICE_SPOTIFY_REDIRECT_URI = 'https://test.com/callback';
process.env.SERVICE_SPOTIFY_AUTH_BASE_URL = 'https://accounts.spotify.com';

// Mock passport with proper methods before it's used in index.ts
jest.mock('passport', () => ({
  initialize: jest.fn(() => (req: any, res: any, next: any) => next()),
  session: jest.fn(() => (req: any, res: any, next: any) => next()),
  use: jest.fn(),
  authenticate: jest.fn(),
  serializeUser: jest.fn(),
  deserializeUser: jest.fn(),
}));

jest.mock('../../../src/routes/auth/auth.service');
jest.mock('../../../src/services/services/spotify/oauth');
jest.mock('../../../src/utils/auth');
jest.mock('jsonwebtoken');

import { initializeSpotifyPassport } from '../../../src/services/services/spotify/passport';
import { connectOAuthProvider } from '../../../src/routes/auth/auth.service';
import { spotifyOAuth } from '../../../src/services/services/spotify/oauth';
import { getCurrentUser } from '../../../src/utils/auth';

describe('Spotify Passport Strategy', () => {
  const originalEnv = process.env;
  let mockStrategy: any;
  let strategyCallback: any;

  beforeEach(() => {
    jest.clearAllMocks();

    process.env = {
      ...originalEnv,
      SERVICE_SPOTIFY_AUTH_BASE_URL: 'https://accounts.spotify.com',
      SERVICE_SPOTIFY_CLIENT_ID: 'test-client-id',
      SERVICE_SPOTIFY_CLIENT_SECRET: 'test-client-secret',
      SERVICE_SPOTIFY_REDIRECT_URI: 'https://test.com/callback',
    };

    (passport.use as jest.Mock).mockImplementation((name, strategy) => {
      mockStrategy = strategy;
      return passport;
    });
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('initializeSpotifyPassport', () => {
    it('should register spotify-subscribe strategy', () => {
      initializeSpotifyPassport();

      expect(passport.use).toHaveBeenCalledWith(
        'spotify-subscribe',
        expect.any(Object)
      );
    });

    it('should configure strategy with correct options', () => {
      const mockUse = jest.fn();
      (passport.use as jest.Mock) = mockUse;

      initializeSpotifyPassport();

      expect(mockUse).toHaveBeenCalled();
      const call = (passport.use as jest.Mock).mock.calls[0];
      expect(call[0]).toBe('spotify-subscribe');
      expect(call[1]).toBeDefined(); // Strategy instance
    });
  });

  describe('strategy callback', () => {
    let req: any;
    let done: jest.Mock;

    beforeEach(async () => {
      req = {};
      done = jest.fn();

      mockStrategyCallback = null;
      initializeSpotifyPassport();

      // Get the callback from the mock
      strategyCallback = mockStrategyCallback;
    });

    it('should return error when user not authenticated', async () => {
      (getCurrentUser as jest.Mock).mockResolvedValue(null);

      if (strategyCallback) {
        await strategyCallback(
          req,
          'access-token',
          'refresh-token',
          { expires_in: 3600, scope: 'user-read-email' },
          {},
          done
        );
      }

      expect(done).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'User not authenticated',
        }),
        null
      );
    });

    it('should successfully authenticate user', async () => {
      const mockUser = { id: 1, email: 'test@example.com' };
      const mockSpotifyUser = {
        id: 'spotify-123',
        display_name: 'TestUser',
        email: 'test@example.com',
      };
      const mockToken = 'jwt-token-123';

      (getCurrentUser as jest.Mock).mockResolvedValue(mockUser);
      (spotifyOAuth.getUserInfo as jest.Mock).mockResolvedValue(
        mockSpotifyUser
      );
      (connectOAuthProvider as jest.Mock).mockResolvedValue(mockToken);
      (jwt.verify as jest.Mock).mockReturnValue({ id: 1 });
      (spotifyOAuth.storeUserToken as jest.Mock).mockResolvedValue(undefined);

      if (strategyCallback) {
        await strategyCallback(
          req,
          'access-token',
          'refresh-token',
          { expires_in: 3600, scope: 'user-read-email' },
          {},
          done
        );
      }

      expect(spotifyOAuth.getUserInfo).toHaveBeenCalledWith('access-token');
      expect(connectOAuthProvider).toHaveBeenCalledWith(
        1,
        'spotify',
        'spotify-123',
        'test@example.com',
        'TestUser'
      );
      expect(spotifyOAuth.storeUserToken).toHaveBeenCalled();
      expect(done).toHaveBeenCalledWith(null, {
        id: 'spotify-123',
        name: 'TestUser',
        email: 'test@example.com',
        token: mockToken,
      });
    });

    it('should handle connectOAuthProvider error', async () => {
      const mockUser = { id: 1 };
      const mockSpotifyUser = {
        id: 'spotify-123',
        display_name: 'TestUser',
        email: 'test@example.com',
      };
      const error = new Error('OAuth connection failed');

      (getCurrentUser as jest.Mock).mockResolvedValue(mockUser);
      (spotifyOAuth.getUserInfo as jest.Mock).mockResolvedValue(
        mockSpotifyUser
      );
      (connectOAuthProvider as jest.Mock).mockResolvedValue(error);

      if (strategyCallback) {
        await strategyCallback(
          req,
          'access-token',
          'refresh-token',
          { expires_in: 3600 },
          {},
          done
        );
      }

      expect(done).toHaveBeenCalledWith(error, null);
    });

    it('should handle subscription error gracefully', async () => {
      const mockUser = { id: 1 };
      const mockSpotifyUser = {
        id: 'spotify-123',
        display_name: 'TestUser',
        email: 'test@example.com',
      };
      const mockToken = 'jwt-token-123';

      (getCurrentUser as jest.Mock).mockResolvedValue(mockUser);
      (spotifyOAuth.getUserInfo as jest.Mock).mockResolvedValue(
        mockSpotifyUser
      );
      (connectOAuthProvider as jest.Mock).mockResolvedValue(mockToken);
      (jwt.verify as jest.Mock).mockReturnValue({ id: 1 });
      (spotifyOAuth.storeUserToken as jest.Mock).mockResolvedValue(undefined);

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      if (strategyCallback) {
        await strategyCallback(
          req,
          'access-token',
          'refresh-token',
          { expires_in: 3600 },
          {},
          done
        );
      }

      // Should still call done with user despite subscription error
      expect(done).toHaveBeenCalledWith(
        null,
        expect.objectContaining({
          id: 'spotify-123',
        })
      );

      consoleErrorSpy.mockRestore();
    });

    it('should handle general errors', async () => {
      const error = new Error('Unexpected error');

      (getCurrentUser as jest.Mock).mockRejectedValue(error);

      if (strategyCallback) {
        await strategyCallback(
          req,
          'access-token',
          'refresh-token',
          { expires_in: 3600 },
          {},
          done
        );
      }

      expect(done).toHaveBeenCalledWith(error, null);
    });

    it('should use default scope when not provided', async () => {
      const mockUser = { id: 1 };
      const mockSpotifyUser = {
        id: 'spotify-123',
        display_name: 'TestUser',
        email: 'test@example.com',
      };
      const mockToken = 'jwt-token-123';

      (getCurrentUser as jest.Mock).mockResolvedValue(mockUser);
      (spotifyOAuth.getUserInfo as jest.Mock).mockResolvedValue(
        mockSpotifyUser
      );
      (connectOAuthProvider as jest.Mock).mockResolvedValue(mockToken);
      (jwt.verify as jest.Mock).mockReturnValue({ id: 1 });
      (spotifyOAuth.storeUserToken as jest.Mock).mockResolvedValue(undefined);

      if (strategyCallback) {
        await strategyCallback(
          req,
          'access-token',
          'refresh-token',
          { expires_in: 3600 },
          {},
          done
        );
      }

      expect(spotifyOAuth.storeUserToken).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          scope: expect.stringContaining('user-read-email'),
        })
      );
    });

    it('should use default expires_in when not provided', async () => {
      const mockUser = { id: 1 };
      const mockSpotifyUser = {
        id: 'spotify-123',
        display_name: 'TestUser',
        email: 'test@example.com',
      };
      const mockToken = 'jwt-token-123';

      (getCurrentUser as jest.Mock).mockResolvedValue(mockUser);
      (spotifyOAuth.getUserInfo as jest.Mock).mockResolvedValue(
        mockSpotifyUser
      );
      (connectOAuthProvider as jest.Mock).mockResolvedValue(mockToken);
      (jwt.verify as jest.Mock).mockReturnValue({ id: 1 });
      (spotifyOAuth.storeUserToken as jest.Mock).mockResolvedValue(undefined);

      if (strategyCallback) {
        await strategyCallback(
          req,
          'access-token',
          'refresh-token',
          {},
          {},
          done
        );
      }

      expect(spotifyOAuth.storeUserToken).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          expires_in: 3600,
        })
      );
    });
  });
});
