import { AppDataSource } from '../../../src/config/db';
import { UserToken } from '../../../src/config/entity/UserToken';

jest.mock('../../../src/config/db');

// Mock node-fetch before importing oauth.ts to avoid ESM issues
const mockFetch = jest.fn() as jest.MockedFunction<typeof fetch>;
jest.mock('node-fetch', () => mockFetch);
global.fetch = mockFetch;

// Set environment variables before importing oauth to avoid instantiation error
process.env.SERVICE_TWITCH_CLIENT_ID = 'test-client-id';
process.env.SERVICE_TWITCH_CLIENT_SECRET = 'test-client-secret';
process.env.SERVICE_TWITCH_REDIRECT_URI = 'https://test.com/callback';
process.env.SERVICE_TWITCH_API_BASE_URL = 'https://api.twitch.tv/helix';
process.env.SERVICE_TWITCH_AUTH_BASE_URL = 'https://id.twitch.tv/oauth2';

import { TwitchOAuth } from '../../../src/services/services/twitch/oauth';

describe('TwitchOAuth', () => {
  let oauth: TwitchOAuth;
  let mockTokenRepo: any;

  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = {
      ...originalEnv,
      SERVICE_TWITCH_CLIENT_ID: 'test-client-id',
      SERVICE_TWITCH_CLIENT_SECRET: 'test-client-secret',
      SERVICE_TWITCH_REDIRECT_URI: 'https://test.com/callback',
      SERVICE_TWITCH_API_BASE_URL: 'https://api.twitch.tv/helix',
      SERVICE_TWITCH_AUTH_BASE_URL: 'https://id.twitch.tv/oauth2',
    };

    mockTokenRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      save: jest.fn(),
      create: jest.fn(data => data),
    };

    (AppDataSource.getRepository as jest.Mock).mockReturnValue(mockTokenRepo);

    oauth = new TwitchOAuth();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('constructor', () => {
    it('should throw error when config is missing', () => {
      process.env.SERVICE_TWITCH_CLIENT_ID = '';

      expect(() => new TwitchOAuth()).toThrow(
        'Twitch OAuth configuration missing'
      );
    });
  });

  describe('getAuthorizationUrl', () => {
    it('should generate correct authorization URL', () => {
      const state = 'test-state-123';

      const url = oauth.getAuthorizationUrl(state);

      expect(url).toContain('id.twitch.tv/oauth2/authorize');
      expect(url).toContain('client_id=test-client-id');
      expect(url).toContain('redirect_uri=');
      expect(url).toContain('response_type=code');
      expect(url).toContain('scope=');
      expect(url).toContain('state=test-state-123');
      expect(url).toContain('user%3Aread%3Aemail');
      expect(url).toContain('user%3Aedit');
      expect(url).toContain('moderator%3Amanage%3Abanned_users');
      expect(url).toContain('moderator%3Aread%3Afollowers');
    });
  });

  describe('exchangeCodeForToken', () => {
    it('should exchange code for token successfully', async () => {
      const mockTokenData = {
        access_token: 'test-access-token',
        token_type: 'bearer',
        scope: 'user:read:email user:edit',
        expires_in: 3600,
        refresh_token: 'test-refresh-token',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTokenData,
      } as any);

      const result = await oauth.exchangeCodeForToken('test-code');

      expect(result).toEqual(mockTokenData);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://id.twitch.tv/oauth2/token',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        })
      );
    });

    it('should throw error when exchange fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Bad Request',
        json: async () => ({ message: 'Invalid code' }),
      } as any);

      await expect(oauth.exchangeCodeForToken('invalid-code')).rejects.toThrow(
        'Twitch OAuth token exchange failed'
      );
    });
  });

  describe('refreshAccessToken', () => {
    it('should refresh token successfully', async () => {
      const mockTokenData = {
        access_token: 'new-access-token',
        token_type: 'bearer',
        scope: 'user:read:email',
        expires_in: 3600,
        refresh_token: 'new-refresh-token',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTokenData,
      } as any);

      const result = await oauth.refreshAccessToken('old-refresh-token');

      expect(result).toEqual(mockTokenData);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://id.twitch.tv/oauth2/token',
        expect.objectContaining({
          method: 'POST',
        })
      );
    });

    it('should throw error when refresh fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Unauthorized',
        json: async () => ({ message: 'Invalid refresh token' }),
      } as any);

      await expect(oauth.refreshAccessToken('invalid-token')).rejects.toThrow(
        'Twitch OAuth token refresh failed'
      );
    });
  });

  describe('getUserInfo', () => {
    it('should get user info successfully', async () => {
      const mockUser = {
        id: 'user-123',
        login: 'testuser',
        display_name: 'TestUser',
        email: 'test@example.com',
        profile_image_url: 'https://test.com/image.jpg',
        broadcaster_type: 'affiliate',
        description: 'Test description',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [mockUser] }),
      } as any);

      const result = await oauth.getUserInfo('test-token');

      expect(result).toEqual(mockUser);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.twitch.tv/helix/users',
        expect.objectContaining({
          headers: {
            Authorization: 'Bearer test-token',
            'Client-Id': 'test-client-id',
          },
        })
      );
    });

    it('should throw error when API request fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Unauthorized',
      } as any);

      await expect(oauth.getUserInfo('invalid-token')).rejects.toThrow(
        'Failed to get Twitch user info'
      );
    });

    it('should throw error when no user data returned', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      } as any);

      await expect(oauth.getUserInfo('test-token')).rejects.toThrow(
        'No user data returned from Twitch API'
      );
    });

    it('should throw error when data array is empty', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [null] }),
      } as any);

      await expect(oauth.getUserInfo('test-token')).rejects.toThrow(
        'No user data in Twitch API response'
      );
    });
  });

  describe('storeUserToken', () => {
    it('should store new access token', async () => {
      const tokenData = {
        access_token: 'test-access-token',
        token_type: 'bearer',
        scope: 'user:read:email user:edit',
        expires_in: 3600,
      };

      mockTokenRepo.findOne.mockResolvedValue(null);
      mockTokenRepo.save.mockResolvedValue({});

      await oauth.storeUserToken(1, tokenData);

      expect(mockTokenRepo.save).toHaveBeenCalledTimes(1);
      const savedToken = mockTokenRepo.save.mock.calls[0][0];
      expect(savedToken.user_id).toBe(1);
      expect(savedToken.token_type).toBe('twitch_access_token');
      expect(savedToken.token_value).toBe('test-access-token');
      expect(savedToken.expires_at).toBeInstanceOf(Date);
    });

    it('should update existing access token', async () => {
      const existingToken = {
        id: 1,
        user_id: 1,
        token_type: 'twitch_access_token',
        token_value: 'old-token',
        expires_at: new Date(),
      };

      const tokenData = {
        access_token: 'new-access-token',
        token_type: 'bearer',
        scope: 'user:read:email',
        expires_in: 7200,
      };

      mockTokenRepo.findOne.mockResolvedValue(existingToken);
      mockTokenRepo.save.mockResolvedValue(existingToken);

      await oauth.storeUserToken(1, tokenData);

      expect(existingToken.token_value).toBe('new-access-token');
      expect(mockTokenRepo.save).toHaveBeenCalledWith(existingToken);
    });

    it('should store refresh token when provided', async () => {
      const tokenData = {
        access_token: 'test-access-token',
        token_type: 'bearer',
        scope: ['user:read:email', 'user:edit'],
        expires_in: 3600,
        refresh_token: 'test-refresh-token',
      };

      mockTokenRepo.findOne.mockResolvedValue(null);
      mockTokenRepo.save.mockResolvedValue({});

      await oauth.storeUserToken(1, tokenData);

      expect(mockTokenRepo.save).toHaveBeenCalledTimes(2);
    });

    it('should update existing refresh token', async () => {
      const existingRefreshToken = {
        id: 2,
        user_id: 1,
        token_type: 'twitch_refresh_token',
        token_value: 'old-refresh-token',
      };

      const tokenData = {
        access_token: 'test-access-token',
        token_type: 'bearer',
        scope: 'user:read:email',
        expires_in: 3600,
        refresh_token: 'new-refresh-token',
      };

      mockTokenRepo.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(existingRefreshToken);
      mockTokenRepo.save.mockResolvedValue({});

      await oauth.storeUserToken(1, tokenData);

      expect(existingRefreshToken.token_value).toBe('new-refresh-token');
      expect(mockTokenRepo.save).toHaveBeenCalledWith(existingRefreshToken);
    });

    it('should handle scope as string', async () => {
      const tokenData = {
        access_token: 'test-access-token',
        token_type: 'bearer',
        scope: 'user:read:email user:edit',
        expires_in: 3600,
      };

      mockTokenRepo.findOne.mockResolvedValue(null);
      mockTokenRepo.save.mockResolvedValue({});

      await oauth.storeUserToken(1, tokenData);

      const savedToken = mockTokenRepo.save.mock.calls[0][0];
      expect(savedToken.scopes).toEqual(['user:read:email', 'user:edit']);
    });

    it('should handle scope as array', async () => {
      const tokenData = {
        access_token: 'test-access-token',
        token_type: 'bearer',
        scope: ['user:read:email', 'user:edit'],
        expires_in: 3600,
      };

      mockTokenRepo.findOne.mockResolvedValue(null);
      mockTokenRepo.save.mockResolvedValue({});

      await oauth.storeUserToken(1, tokenData);

      const savedToken = mockTokenRepo.save.mock.calls[0][0];
      expect(savedToken.scopes).toEqual(['user:read:email', 'user:edit']);
    });
  });

  describe('getUserToken', () => {
    it('should return valid non-expired token', async () => {
      const validToken = {
        id: 1,
        user_id: 1,
        token_type: 'twitch_access_token',
        token_value: 'valid-token',
        expires_at: new Date(Date.now() + 3600000),
        is_revoked: false,
      };

      mockTokenRepo.findOne.mockResolvedValue(validToken);

      const result = await oauth.getUserToken(1);

      expect(result).toBe(validToken);
    });

    it('should return null when no token found', async () => {
      mockTokenRepo.findOne.mockResolvedValue(null);

      const result = await oauth.getUserToken(1);

      expect(result).toBeNull();
    });

    it('should refresh expired token', async () => {
      const expiredToken = {
        id: 1,
        user_id: 1,
        token_type: 'twitch_access_token',
        token_value: 'expired-token',
        expires_at: new Date(Date.now() - 3600000),
        is_revoked: false,
      };

      const refreshToken = {
        id: 2,
        user_id: 1,
        token_type: 'twitch_refresh_token',
        token_value: 'refresh-token',
        is_revoked: false,
      };

      const newTokenData = {
        access_token: 'new-token',
        token_type: 'bearer',
        scope: 'user:read:email',
        expires_in: 3600,
        refresh_token: 'new-refresh-token',
      };

      const newToken = {
        id: 1,
        user_id: 1,
        token_type: 'twitch_access_token',
        token_value: 'new-token',
        expires_at: new Date(Date.now() + 3600000),
        is_revoked: false,
      };

      mockTokenRepo.findOne
        .mockResolvedValueOnce(expiredToken)
        .mockResolvedValueOnce(refreshToken)
        .mockResolvedValueOnce(expiredToken) // storeUserToken checks for existing token
        .mockResolvedValueOnce(refreshToken) // storeUserToken checks for existing refresh token
        .mockResolvedValueOnce(newToken); // getUserToken re-fetches after refresh

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => newTokenData,
      } as any);

      mockTokenRepo.save.mockResolvedValue({});

      const result = await oauth.getUserToken(1);

      expect(result).toEqual(newToken);
      expect(mockFetch).toHaveBeenCalled();
    });

    it('should return null when refresh fails', async () => {
      const expiredToken = {
        id: 1,
        user_id: 1,
        token_type: 'twitch_access_token',
        token_value: 'expired-token',
        expires_at: new Date(Date.now() - 3600000),
        is_revoked: false,
      };

      const refreshToken = {
        id: 2,
        user_id: 1,
        token_type: 'twitch_refresh_token',
        token_value: 'refresh-token',
        is_revoked: false,
      };

      mockTokenRepo.findOne
        .mockResolvedValueOnce(expiredToken)
        .mockResolvedValueOnce(refreshToken);

      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Unauthorized',
        json: async () => ({ message: 'Invalid refresh token' }),
      } as any);

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await oauth.getUserToken(1);

      expect(result).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to refresh Twitch token:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });

    it('should return null when no refresh token available', async () => {
      const expiredToken = {
        id: 1,
        user_id: 1,
        token_type: 'twitch_access_token',
        token_value: 'expired-token',
        expires_at: new Date(Date.now() - 3600000),
        is_revoked: false,
      };

      mockTokenRepo.findOne
        .mockResolvedValueOnce(expiredToken)
        .mockResolvedValueOnce(null);

      const result = await oauth.getUserToken(1);

      expect(result).toBeNull();
    });
  });

  describe('revokeUserToken', () => {
    it('should revoke all user tokens', async () => {
      const tokens = [
        {
          id: 1,
          user_id: 1,
          token_type: 'twitch_access_token',
          token_value: 'access-token',
          is_revoked: false,
          revoked_at: null as Date | null,
          revoked_reason: null as string | null,
        },
        {
          id: 2,
          user_id: 1,
          token_type: 'twitch_refresh_token',
          token_value: 'refresh-token',
          is_revoked: false,
          revoked_at: null as Date | null,
          revoked_reason: null as string | null,
        },
      ];

      mockTokenRepo.find.mockResolvedValue(tokens);
      mockTokenRepo.save.mockResolvedValue({});

      await oauth.revokeUserToken(1);

      expect(mockTokenRepo.save).toHaveBeenCalledTimes(2);
      expect(tokens[0].is_revoked).toBe(true);
      expect(tokens[0].revoked_at).toBeInstanceOf(Date);
      expect(tokens[0].revoked_reason).toBe('User requested revocation');
      expect(tokens[1].is_revoked).toBe(true);
      expect(tokens[1].revoked_at).toBeInstanceOf(Date);
    });

    it('should handle no tokens found', async () => {
      mockTokenRepo.find.mockResolvedValue([]);

      await oauth.revokeUserToken(1);

      expect(mockTokenRepo.save).not.toHaveBeenCalled();
    });
  });
});
