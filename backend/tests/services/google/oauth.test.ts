import { jest } from '@jest/globals';

// Mock node-fetch BEFORE importing the module
const mockFetch = jest.fn() as any;
jest.mock('node-fetch', () => mockFetch);

// Mock the database
jest.mock('../../../src/config/db', () => ({
  AppDataSource: {
    getRepository: jest.fn(),
  },
}));

describe('GoogleOAuth', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    // Set up environment variables
    process.env.SERVICE_GOOGLE_CLIENT_ID = 'test-client-id';
    process.env.SERVICE_GOOGLE_CLIENT_SECRET = 'test-client-secret';
    process.env.SERVICE_GOOGLE_REDIRECT_URI =
      'http://localhost:8080/auth/google/callback';
    process.env.SERVICE_GOOGLE_API_BASE_URL = 'https://www.googleapis.com';
    process.env.SERVICE_GOOGLE_AUTH_BASE_URL = 'https://accounts.google.com';
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('constructor', () => {
    it('should initialize with default values', () => {
      const {
        GoogleOAuth,
      } = require('../../../src/services/services/google/oauth');
      const oauth = new GoogleOAuth();

      expect(oauth).toBeDefined();
    });
  });

  describe('ensureInitialized', () => {
    it('should initialize with environment variables', () => {
      const {
        GoogleOAuth,
      } = require('../../../src/services/services/google/oauth');
      const oauth = new GoogleOAuth();

      // Access private method for testing
      (oauth as any).ensureInitialized();

      expect((oauth as any).clientId).toBe('test-client-id');
      expect((oauth as any).clientSecret).toBe('test-client-secret');
      expect((oauth as any).redirectUri).toBe(
        'http://localhost:8080/auth/google/callback'
      );
      expect((oauth as any).googleApiBaseUrl).toBe(
        'https://www.googleapis.com'
      );
      expect((oauth as any).googleAuthBaseUrl).toBe(
        'https://accounts.google.com'
      );
    });

    it('should throw error when required environment variables are missing', () => {
      process.env.SERVICE_GOOGLE_CLIENT_ID = '';
      const {
        GoogleOAuth,
      } = require('../../../src/services/services/google/oauth');
      const oauth = new GoogleOAuth();

      expect(() => (oauth as any).ensureInitialized()).toThrow(
        'Google OAuth configuration missing'
      );
    });
  });

  describe('getAuthorizationUrl', () => {
    it('should return correct authorization URL', () => {
      const {
        GoogleOAuth,
      } = require('../../../src/services/services/google/oauth');
      const oauth = new GoogleOAuth();
      (oauth as any).ensureInitialized();

      const state = 'test-state';
      const url = oauth.getAuthorizationUrl(state);

      expect(url).toContain('https://accounts.google.com/o/oauth2/v2/auth');
      expect(url).toContain('client_id=test-client-id');
      expect(url).toContain(
        'redirect_uri=http%3A%2F%2Flocalhost%3A8080%2Fauth%2Fgoogle%2Fcallback'
      );
      expect(url).toContain(
        'scope=openid+https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fuserinfo.email+https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fuserinfo.profile+https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fgmail.send+https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fgmail.modify+https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fcalendar+https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fcalendar.events+https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fdocuments+https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fdrive.file+https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fdrive'
      );
      expect(url).toContain('response_type=code');
      expect(url).toContain('access_type=offline');
      expect(url).toContain('state=test-state');
    });
  });

  describe('exchangeCodeForToken', () => {
    it('should exchange code for token successfully', async () => {
      const mockResponse = {
        access_token: 'test-access-token',
        token_type: 'Bearer',
        expires_in: 3600,
        refresh_token: 'test-refresh-token',
        scope: 'openid https://www.googleapis.com/auth/userinfo.email',
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const {
        GoogleOAuth,
      } = require('../../../src/services/services/google/oauth');
      const oauth = new GoogleOAuth();
      (oauth as any).ensureInitialized();

      const result = await oauth.exchangeCodeForToken('test-code');

      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://accounts.google.com/o/oauth2/token',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Accept: 'application/json',
          },
        })
      );
    });

    it('should handle API errors', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        statusText: 'Bad Request',
        text: () => Promise.resolve('Invalid code'),
      } as any);

      const {
        GoogleOAuth,
      } = require('../../../src/services/services/google/oauth');
      const oauth = new GoogleOAuth();
      (oauth as any).ensureInitialized();

      await expect(oauth.exchangeCodeForToken('invalid-code')).rejects.toThrow(
        'Google OAuth token exchange failed: Bad Request'
      );
    });

    it('should handle OAuth error responses', async () => {
      const mockResponse = {
        error: 'invalid_grant',
        error_description: 'The authorization code is invalid',
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as any);

      const {
        GoogleOAuth,
      } = require('../../../src/services/services/google/oauth');
      const oauth = new GoogleOAuth();
      (oauth as any).ensureInitialized();

      await expect(oauth.exchangeCodeForToken('invalid-code')).rejects.toThrow(
        'Google OAuth error: invalid_grant'
      );
    });
  });

  describe('refreshAccessToken', () => {
    it('should refresh access token successfully', async () => {
      const mockResponse = {
        access_token: 'new-access-token',
        token_type: 'Bearer',
        expires_in: 3600,
        scope: 'openid https://www.googleapis.com/auth/userinfo.email',
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as any);

      const {
        GoogleOAuth,
      } = require('../../../src/services/services/google/oauth');
      const oauth = new GoogleOAuth();
      (oauth as any).ensureInitialized();

      const result = await oauth.refreshAccessToken('test-refresh-token');

      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://accounts.google.com/o/oauth2/token',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Accept: 'application/json',
          },
        })
      );
    });

    it('should handle refresh API errors', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        statusText: 'Bad Request',
      } as any);

      const {
        GoogleOAuth,
      } = require('../../../src/services/services/google/oauth');
      const oauth = new GoogleOAuth();
      (oauth as any).ensureInitialized();

      await expect(
        oauth.refreshAccessToken('invalid-refresh-token')
      ).rejects.toThrow('Google OAuth token refresh failed: Bad Request');
    });

    it('should handle OAuth refresh error responses', async () => {
      const mockResponse = {
        error: 'invalid_grant',
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as any);

      const {
        GoogleOAuth,
      } = require('../../../src/services/services/google/oauth');
      const oauth = new GoogleOAuth();
      (oauth as any).ensureInitialized();

      await expect(
        oauth.refreshAccessToken('invalid-refresh-token')
      ).rejects.toThrow('Google OAuth refresh error: invalid_grant');
    });
  });

  describe('getUserInfo', () => {
    it('should get user info successfully', async () => {
      const mockUserInfo = {
        id: 'user-id',
        email: 'user@example.com',
        name: 'Test User',
        given_name: 'Test',
        family_name: 'User',
        verified_email: true,
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockUserInfo),
      } as any);

      const {
        GoogleOAuth,
      } = require('../../../src/services/services/google/oauth');
      const oauth = new GoogleOAuth();
      (oauth as any).ensureInitialized();

      const result = await oauth.getUserInfo('test-access-token');

      expect(result).toEqual(mockUserInfo);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://www.googleapis.com/oauth2/v2/userinfo',
        {
          headers: {
            Authorization: 'Bearer test-access-token',
            Accept: 'application/json',
          },
        }
      );
    });

    it('should handle API errors', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        statusText: 'Unauthorized',
      } as any);

      const {
        GoogleOAuth,
      } = require('../../../src/services/services/google/oauth');
      const oauth = new GoogleOAuth();
      (oauth as any).ensureInitialized();

      await expect(oauth.getUserInfo('invalid-token')).rejects.toThrow(
        'Failed to get Google user info: Unauthorized'
      );
    });
  });

  describe('storeUserToken', () => {
    const { AppDataSource } = require('../../../src/config/db');

    it('should store new access token', async () => {
      const mockRepository = {
        findOne: jest.fn() as any,
        create: jest.fn() as any,
        save: jest.fn() as any,
      };
      (AppDataSource.getRepository as any).mockReturnValue(mockRepository);
      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockReturnValue({});
      mockRepository.save.mockResolvedValue({});

      const {
        GoogleOAuth,
      } = require('../../../src/services/services/google/oauth');
      const oauth = new GoogleOAuth();
      (oauth as any).ensureInitialized();

      const tokenData = {
        access_token: 'test-access-token',
        token_type: 'Bearer',
        expires_in: 3600,
        refresh_token: 'test-refresh-token',
        scope: 'openid https://www.googleapis.com/auth/userinfo.email',
      };

      await oauth.storeUserToken(1, tokenData);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: {
          user_id: 1,
          token_type: 'google_access_token',
        },
      });
      expect(mockRepository.create).toHaveBeenCalledTimes(2); // access token and refresh token
      expect(mockRepository.save).toHaveBeenCalledTimes(2);
    });

    it('should update existing access token', async () => {
      const existingToken = { token_value: 'old-token' };
      const mockRepository = {
        findOne: jest.fn() as any,
        create: jest.fn() as any,
        save: jest.fn() as any,
      };
      (AppDataSource.getRepository as any).mockReturnValue(mockRepository);
      mockRepository.findOne.mockResolvedValue(existingToken);
      mockRepository.create.mockReturnValue({});
      mockRepository.save.mockResolvedValue({});

      const {
        GoogleOAuth,
      } = require('../../../src/services/services/google/oauth');
      const oauth = new GoogleOAuth();
      (oauth as any).ensureInitialized();

      const tokenData = {
        access_token: 'new-access-token',
        token_type: 'Bearer',
        expires_in: 3600,
        scope: 'openid https://www.googleapis.com/auth/userinfo.email',
      };

      await oauth.storeUserToken(1, tokenData);

      expect(existingToken.token_value).toBe('new-access-token');
      expect(mockRepository.save).toHaveBeenCalledWith(existingToken);
    });

    it('should handle tokens without refresh token', async () => {
      const mockRepository = {
        findOne: jest.fn() as any,
        create: jest.fn() as any,
        save: jest.fn() as any,
      };
      (AppDataSource.getRepository as any).mockReturnValue(mockRepository);
      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockReturnValue({});
      mockRepository.save.mockResolvedValue({});

      const {
        GoogleOAuth,
      } = require('../../../src/services/services/google/oauth');
      const oauth = new GoogleOAuth();
      (oauth as any).ensureInitialized();

      const tokenData = {
        access_token: 'test-access-token',
        token_type: 'Bearer',
        expires_in: 3600,
        scope: 'openid https://www.googleapis.com/auth/userinfo.email',
        // no refresh_token
      };

      await oauth.storeUserToken(1, tokenData);

      expect(mockRepository.create).toHaveBeenCalledTimes(1); // only access token
      expect(mockRepository.save).toHaveBeenCalledTimes(1);
    });
  });

  describe('getUserToken', () => {
    const { AppDataSource } = require('../../../src/config/db');

    it('should return valid token', async () => {
      const validToken = {
        token_value: 'valid-token',
        expires_at: new Date(Date.now() + 3600000), // 1 hour from now
        is_revoked: false,
      };

      const mockRepository = {
        findOne: jest.fn() as any,
      };
      (AppDataSource.getRepository as any).mockReturnValue(mockRepository);
      mockRepository.findOne.mockResolvedValue(validToken);

      const {
        GoogleOAuth,
      } = require('../../../src/services/services/google/oauth');
      const oauth = new GoogleOAuth();

      const result = await oauth.getUserToken(1);

      expect(result).toBe(validToken);
    });

    it('should return null for expired token without refresh token', async () => {
      const expiredToken = {
        token_value: 'expired-token',
        expires_at: new Date(Date.now() - 3600000), // 1 hour ago
        is_revoked: false,
      };

      const mockRepository = {
        findOne: jest.fn() as any,
      };
      (AppDataSource.getRepository as any).mockReturnValue(mockRepository);
      mockRepository.findOne
        .mockResolvedValueOnce(expiredToken)
        .mockResolvedValueOnce(null); // no refresh token

      const {
        GoogleOAuth,
      } = require('../../../src/services/services/google/oauth');
      const oauth = new GoogleOAuth();

      const result = await oauth.getUserToken(1);

      expect(result).toBeNull();
    });

    it('should return null when no token found', async () => {
      const mockRepository = {
        findOne: jest.fn() as any,
      };
      (AppDataSource.getRepository as any).mockReturnValue(mockRepository);
      mockRepository.findOne.mockResolvedValue(null);

      const {
        GoogleOAuth,
      } = require('../../../src/services/services/google/oauth');
      const oauth = new GoogleOAuth();

      const result = await oauth.getUserToken(1);

      expect(result).toBeNull();
    });

    it('should return null for revoked token', async () => {
      const revokedToken = {
        token_value: 'revoked-token',
        expires_at: new Date(Date.now() + 3600000),
        is_revoked: true,
      };

      const mockRepository = {
        findOne: jest.fn() as any,
      };
      (AppDataSource.getRepository as any).mockReturnValue(mockRepository);

      // Mock findOne to return null when searching for non-revoked tokens
      mockRepository.findOne.mockImplementation((options: any) => {
        if (options.where && options.where.is_revoked === false) {
          return Promise.resolve(null); // No valid token found
        }
        return Promise.resolve(revokedToken);
      });

      const {
        GoogleOAuth,
      } = require('../../../src/services/services/google/oauth');
      const oauth = new GoogleOAuth();

      const result = await oauth.getUserToken(1);

      expect(result).toBeNull();
    });
  });

  describe('revokeUserToken', () => {
    const { AppDataSource } = require('../../../src/config/db');

    it('should revoke user tokens', async () => {
      const tokens = [
        { is_revoked: false, revoked_at: null, revoked_reason: null },
        { is_revoked: false, revoked_at: null, revoked_reason: null },
      ];

      const mockRepository = {
        find: jest.fn() as any,
        save: jest.fn() as any,
      };
      (AppDataSource.getRepository as any).mockReturnValue(mockRepository);
      mockRepository.find.mockResolvedValue(tokens);
      mockRepository.save.mockResolvedValue({});

      const {
        GoogleOAuth,
      } = require('../../../src/services/services/google/oauth');
      const oauth = new GoogleOAuth();

      await oauth.revokeUserToken(1);

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: [
          {
            user_id: 1,
            token_type: 'google_access_token',
          },
          {
            user_id: 1,
            token_type: 'google_refresh_token',
          },
        ],
      });

      expect(mockRepository.save).toHaveBeenCalledTimes(2);
      tokens.forEach(token => {
        expect(token.is_revoked).toBe(true);
        expect(token.revoked_reason).toBe('User requested revocation');
        expect(token.revoked_at).toBeInstanceOf(Date);
      });
    });

    it('should handle empty token list', async () => {
      const mockRepository = {
        find: jest.fn() as any,
        save: jest.fn() as any,
      };
      (AppDataSource.getRepository as any).mockReturnValue(mockRepository);
      mockRepository.find.mockResolvedValue([]);
      mockRepository.save.mockResolvedValue({});

      const {
        GoogleOAuth,
      } = require('../../../src/services/services/google/oauth');
      const oauth = new GoogleOAuth();

      await oauth.revokeUserToken(1);

      expect(mockRepository.save).not.toHaveBeenCalled();
    });
  });
});
