// Set environment variables FIRST, before any imports
process.env.SERVICE_SPOTIFY_CLIENT_ID = 'test-client-id';
process.env.SERVICE_SPOTIFY_CLIENT_SECRET = 'test-client-secret';
process.env.SERVICE_SPOTIFY_REDIRECT_URI = 'http://localhost:3000/callback';
process.env.SERVICE_SPOTIFY_API_BASE_URL = 'https://api.spotify.com';
process.env.SERVICE_SPOTIFY_AUTH_BASE_URL = 'https://accounts.spotify.com';

// Mock node-fetch BEFORE importing the module
const mockFetch = jest.fn();
jest.mock('node-fetch', () => mockFetch);

// Mock AppDataSource
jest.mock('../../../src/config/db', () => ({
  AppDataSource: {
    getRepository: jest.fn(),
  },
}));

import { SpotifyOAuth } from '../../../src/services/services/spotify/oauth';
import { AppDataSource } from '../../../src/config/db';

describe('SpotifyOAuth', () => {
  let spotifyOAuth: SpotifyOAuth;
  let mockRepository: {
    findOne: jest.Mock;
    save: jest.Mock;
    create: jest.Mock;
    find: jest.Mock;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    spotifyOAuth = new SpotifyOAuth();

    mockRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
      create: jest.fn(data => data),
      find: jest.fn(),
    };
    (AppDataSource.getRepository as jest.Mock).mockReturnValue(mockRepository);
  });

  afterAll(() => {
    delete process.env.SERVICE_SPOTIFY_CLIENT_ID;
    delete process.env.SERVICE_SPOTIFY_CLIENT_SECRET;
    delete process.env.SERVICE_SPOTIFY_REDIRECT_URI;
    delete process.env.SERVICE_SPOTIFY_API_BASE_URL;
    delete process.env.SERVICE_SPOTIFY_AUTH_BASE_URL;
  });

  describe('constructor', () => {
    it('should create an instance with env vars', () => {
      expect(spotifyOAuth).toBeDefined();
    });

    it('should throw error if missing required env vars', () => {
      const oldClientId = process.env.SERVICE_SPOTIFY_CLIENT_ID;
      delete process.env.SERVICE_SPOTIFY_CLIENT_ID;

      expect(() => new SpotifyOAuth()).toThrow(
        'Spotify OAuth configuration missing'
      );

      process.env.SERVICE_SPOTIFY_CLIENT_ID = oldClientId;
    });

    it('should use default URLs if not provided', () => {
      delete process.env.SERVICE_SPOTIFY_API_BASE_URL;
      delete process.env.SERVICE_SPOTIFY_AUTH_BASE_URL;

      const oauth = new SpotifyOAuth();
      const authUrl = oauth.getAuthorizationUrl('test-state');

      expect(authUrl).toContain('https://accounts.spotify.com/authorize');

      process.env.SERVICE_SPOTIFY_API_BASE_URL = 'https://api.spotify.com';
      process.env.SERVICE_SPOTIFY_AUTH_BASE_URL =
        'https://accounts.spotify.com';
    });
  });

  describe('getAuthorizationUrl', () => {
    it('should return correct authorization URL with state', () => {
      const state = 'test-state-123';
      const url = spotifyOAuth.getAuthorizationUrl(state);

      expect(url).toContain('https://accounts.spotify.com/authorize');
      expect(url).toContain(`client_id=test-client-id`);
      expect(url).toContain(`response_type=code`);
      expect(url).toContain(
        `redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fcallback`
      );
      expect(url).toContain(`state=${state}`);
      expect(url).toContain('scope=');
      expect(url).toContain('user-read-email');
      expect(url).toContain('user-modify-playback-state');
    });

    it('should include all required scopes', () => {
      const url = spotifyOAuth.getAuthorizationUrl('state');

      expect(url).toContain('user-read-email');
      expect(url).toContain('user-read-private');
      expect(url).toContain('user-modify-playback-state');
      expect(url).toContain('playlist-modify-public');
      expect(url).toContain('playlist-modify-private');
      expect(url).toContain('user-read-playback-state');
      expect(url).toContain('user-library-read');
      expect(url).toContain('user-library-modify');
    });
  });

  describe('exchangeCodeForToken', () => {
    it('should exchange code for token successfully', async () => {
      const mockTokenResponse = {
        access_token: 'test-access-token',
        token_type: 'Bearer',
        scope: 'user-read-email user-read-private',
        expires_in: 3600,
        refresh_token: 'test-refresh-token',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTokenResponse,
      });

      const result = await spotifyOAuth.exchangeCodeForToken('test-code');

      expect(result).toEqual(mockTokenResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://accounts.spotify.com/api/token',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: expect.stringContaining('Basic'),
          }),
        })
      );
    });

    it('should handle failed token exchange', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Bad Request',
      });

      await expect(
        spotifyOAuth.exchangeCodeForToken('bad-code')
      ).rejects.toThrow('Spotify OAuth token exchange failed: Bad Request');
    });

    it('should handle error response from Spotify', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          error: 'invalid_grant',
          error_description: 'Invalid authorization code',
        }),
      });

      await expect(
        spotifyOAuth.exchangeCodeForToken('invalid-code')
      ).rejects.toThrow('Spotify OAuth error: invalid_grant');
    });
  });

  describe('refreshAccessToken', () => {
    it('should refresh access token successfully', async () => {
      const mockRefreshResponse = {
        access_token: 'new-access-token',
        token_type: 'Bearer',
        scope: 'user-read-email user-read-private',
        expires_in: 3600,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockRefreshResponse,
      });

      const result = await spotifyOAuth.refreshAccessToken('refresh-token');

      expect(result).toEqual(mockRefreshResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://accounts.spotify.com/api/token',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: expect.stringContaining('Basic'),
          }),
        })
      );
    });

    it('should handle failed token refresh', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Unauthorized',
      });

      await expect(
        spotifyOAuth.refreshAccessToken('bad-token')
      ).rejects.toThrow('Spotify OAuth token refresh failed: Unauthorized');
    });

    it('should handle error response during refresh', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          error: 'invalid_token',
          error_description: 'Refresh token is invalid',
        }),
      });

      await expect(
        spotifyOAuth.refreshAccessToken('invalid-token')
      ).rejects.toThrow('Spotify OAuth refresh error: invalid_token');
    });
  });

  describe('getUserInfo', () => {
    it('should get user info successfully', async () => {
      const mockUserInfo = {
        id: 'spotify-user-123',
        display_name: 'Test User',
        email: 'test@example.com',
        images: [
          { url: 'https://example.com/image.jpg', height: 300, width: 300 },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockUserInfo,
      });

      const result = await spotifyOAuth.getUserInfo('access-token');

      expect(result).toEqual(mockUserInfo);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.spotify.com/v1/me',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer access-token',
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('should handle failed user info request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Unauthorized',
      });

      await expect(spotifyOAuth.getUserInfo('bad-token')).rejects.toThrow(
        'Failed to get Spotify user info: Unauthorized'
      );
    });
  });

  describe('storeUserToken', () => {
    const tokenData = {
      access_token: 'test-access-token',
      token_type: 'bearer',
      scope: 'user-read-email user-read-private',
      expires_in: 3600,
      refresh_token: 'test-refresh-token',
    };

    it('should create new access token when none exists', async () => {
      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.save.mockResolvedValue({});

      await spotifyOAuth.storeUserToken(1, tokenData);

      expect(mockRepository.findOne).toHaveBeenCalledTimes(2);
      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 1,
          token_type: 'spotify_access_token',
          token_value: 'test-access-token',
          scopes: ['user-read-email', 'user-read-private'],
        })
      );
      expect(mockRepository.save).toHaveBeenCalledTimes(2);
    });

    it('should update existing access token', async () => {
      const existingToken = {
        id: 1,
        token_value: 'old-token',
        expires_at: new Date(),
      };

      mockRepository.findOne
        .mockResolvedValueOnce(existingToken)
        .mockResolvedValueOnce(null);

      await spotifyOAuth.storeUserToken(1, tokenData);

      expect(existingToken.token_value).toBe('test-access-token');
      expect(mockRepository.save).toHaveBeenCalledWith(existingToken);
    });

    it('should store refresh token when provided', async () => {
      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.save.mockResolvedValue({});

      await spotifyOAuth.storeUserToken(1, tokenData);

      const calls = mockRepository.create.mock.calls;
      const refreshTokenCall = calls.find(
        (call: unknown[]) =>
          (call[0] as { token_type: string }).token_type ===
          'spotify_refresh_token'
      );

      expect(refreshTokenCall).toBeDefined();
      expect(refreshTokenCall![0]).toMatchObject({
        user_id: 1,
        token_type: 'spotify_refresh_token',
        token_value: 'test-refresh-token',
      });
    });

    it('should not store refresh token when not provided', async () => {
      const tokenDataWithoutRefresh = {
        access_token: 'test-access-token',
        token_type: 'bearer',
        scope: 'user-read-email user-read-private',
        expires_in: 3600,
      };

      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.save.mockResolvedValue({});

      await spotifyOAuth.storeUserToken(
        1,
        tokenDataWithoutRefresh as typeof tokenData
      );

      const calls = mockRepository.create.mock.calls;
      expect(calls).toHaveLength(1); // Only access token
    });

    it('should calculate correct expiration time', async () => {
      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.save.mockResolvedValue({});

      const beforeTime = Date.now();
      await spotifyOAuth.storeUserToken(1, tokenData);
      const afterTime = Date.now();

      const createCall = mockRepository.create.mock.calls[0][0];
      const expiresAt = createCall.expires_at as Date;

      expect(expiresAt.getTime()).toBeGreaterThanOrEqual(
        beforeTime + 3600 * 1000
      );
      expect(expiresAt.getTime()).toBeLessThanOrEqual(afterTime + 3600 * 1000);
    });
  });

  describe('getUserToken', () => {
    it('should return valid token', async () => {
      const validToken = {
        id: 1,
        user_id: 1,
        token_type: 'spotify_access_token',
        token_value: 'valid-token',
        expires_at: new Date(Date.now() + 3600000),
        is_revoked: false,
      };

      mockRepository.findOne.mockResolvedValue(validToken);

      const result = await spotifyOAuth.getUserToken(1);

      expect(result).toEqual(validToken);
    });

    it('should return null if no token found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await spotifyOAuth.getUserToken(1);

      expect(result).toBeNull();
    });

    it('should refresh expired token', async () => {
      const expiredToken = {
        id: 1,
        user_id: 1,
        token_type: 'spotify_access_token',
        token_value: 'expired-token',
        expires_at: new Date(Date.now() - 1000),
        is_revoked: false,
      };

      const refreshToken = {
        id: 2,
        user_id: 1,
        token_type: 'spotify_refresh_token',
        token_value: 'refresh-token',
        is_revoked: false,
      };

      const newToken = {
        ...expiredToken,
        token_value: 'new-token',
        expires_at: new Date(Date.now() + 3600000),
      };

      mockRepository.findOne
        .mockResolvedValueOnce(expiredToken) // 1. getUserToken: get expired access token
        .mockResolvedValueOnce(refreshToken) // 2. getUserToken: get refresh token
        .mockResolvedValueOnce(expiredToken) // 3. storeUserToken: check existing access token
        .mockResolvedValueOnce(newToken); // 4. getUserToken: return updated token after refresh

      mockRepository.save.mockResolvedValueOnce(newToken); // Save updated access token

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          access_token: 'new-token',
          token_type: 'bearer',
          scope: 'user-read-email',
          expires_in: 3600,
        }),
      });

      const result = await spotifyOAuth.getUserToken(1);

      expect(result).toEqual(newToken);
      expect(mockFetch).toHaveBeenCalled();
    });

    it('should return null if refresh fails', async () => {
      const expiredToken = {
        id: 1,
        user_id: 1,
        token_type: 'spotify_access_token',
        token_value: 'expired-token',
        expires_at: new Date(Date.now() - 1000),
        is_revoked: false,
      };

      const refreshToken = {
        id: 2,
        user_id: 1,
        token_type: 'spotify_refresh_token',
        token_value: 'refresh-token',
        is_revoked: false,
      };

      mockRepository.findOne
        .mockResolvedValueOnce(expiredToken)
        .mockResolvedValueOnce(refreshToken);

      mockFetch.mockRejectedValueOnce(new Error('Refresh failed'));

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await spotifyOAuth.getUserToken(1);

      expect(result).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to refresh Spotify token:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });

    it('should return null if no refresh token available', async () => {
      const expiredToken = {
        id: 1,
        user_id: 1,
        token_type: 'spotify_access_token',
        token_value: 'expired-token',
        expires_at: new Date(Date.now() - 1000),
        is_revoked: false,
      };

      mockRepository.findOne
        .mockResolvedValueOnce(expiredToken)
        .mockResolvedValueOnce(null);

      const result = await spotifyOAuth.getUserToken(1);

      expect(result).toBeNull();
    });
  });

  describe('revokeUserToken', () => {
    it('should revoke all user tokens', async () => {
      const tokens = [
        {
          id: 1,
          user_id: 1,
          token_type: 'spotify_access_token',
          is_revoked: false,
          revoked_at: null as Date | null,
          revoked_reason: null as string | null,
        },
        {
          id: 2,
          user_id: 1,
          token_type: 'spotify_refresh_token',
          is_revoked: false,
          revoked_at: null as Date | null,
          revoked_reason: null as string | null,
        },
      ];

      mockRepository.find.mockResolvedValue(tokens);
      mockRepository.save.mockResolvedValue({});

      await spotifyOAuth.revokeUserToken(1);

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: [
          { user_id: 1, token_type: 'spotify_access_token' },
          { user_id: 1, token_type: 'spotify_refresh_token' },
        ],
      });

      tokens.forEach(token => {
        expect(token.is_revoked).toBe(true);
        expect(token.revoked_at).toBeInstanceOf(Date);
        expect(token.revoked_reason).toBe('User requested revocation');
      });

      expect(mockRepository.save).toHaveBeenCalledTimes(2);
    });

    it('should handle case with no tokens', async () => {
      mockRepository.find.mockResolvedValue([]);

      await expect(spotifyOAuth.revokeUserToken(1)).resolves.not.toThrow();
      expect(mockRepository.save).not.toHaveBeenCalled();
    });
  });
});
