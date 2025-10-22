import { jest } from '@jest/globals';

// Mock node-fetch
jest.mock('node-fetch', () => jest.fn());

// Mock the database
jest.mock('../../../src/config/db', () => ({
  AppDataSource: {
    getRepository: jest.fn(),
  },
}));

describe('MicrosoftOAuth', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    // Set up environment variables
    process.env.SERVICE_MICROSOFT_CLIENT_ID = 'test-client-id';
    process.env.SERVICE_MICROSOFT_CLIENT_SECRET = 'test-client-secret';
    process.env.SERVICE_MICROSOFT_REDIRECT_URI =
      'http://localhost:8080/auth/microsoft/callback';
    process.env.SERVICE_MICROSOFT_TENANT_ID = 'test-tenant-id';
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('constructor', () => {
    it('should initialize with default values', () => {
      const {
        MicrosoftOAuth,
      } = require('../../../src/services/services/microsoft/oauth');
      const oauth = new MicrosoftOAuth();

      expect(oauth).toBeDefined();
    });
  });

  describe('ensureInitialized', () => {
    it('should initialize with environment variables', () => {
      const {
        MicrosoftOAuth,
      } = require('../../../src/services/services/microsoft/oauth');
      const oauth = new MicrosoftOAuth();

      // Access private method for testing
      (oauth as any).ensureInitialized();

      expect((oauth as any).clientId).toBe('test-client-id');
      expect((oauth as any).clientSecret).toBe('test-client-secret');
      expect((oauth as any).redirectUri).toBe(
        'http://localhost:8080/auth/microsoft/callback'
      );
      expect((oauth as any).tenantId).toBe('test-tenant-id');
    });

    it('should throw error when required environment variables are missing', () => {
      process.env.SERVICE_MICROSOFT_CLIENT_ID = '';
      const {
        MicrosoftOAuth,
      } = require('../../../src/services/services/microsoft/oauth');
      const oauth = new MicrosoftOAuth();

      expect(() => (oauth as any).ensureInitialized()).toThrow(
        'Microsoft OAuth configuration missing'
      );
    });
  });

  describe('getAuthorizationUrl', () => {
    it('should return correct authorization URL', () => {
      const {
        MicrosoftOAuth,
      } = require('../../../src/services/services/microsoft/oauth');
      const oauth = new MicrosoftOAuth();
      (oauth as any).ensureInitialized();

      const state = 'test-state';
      const url = oauth.getAuthorizationUrl(state);

      expect(url).toContain(
        'https://login.microsoftonline.com/test-tenant-id/oauth2/v2.0/authorize'
      );
      expect(url).toContain('client_id=test-client-id');
      expect(url).toContain(
        'redirect_uri=http%3A%2F%2Flocalhost%3A8080%2Fauth%2Fmicrosoft%2Fcallback'
      );
      expect(url).toContain(
        'scope=openid+email+profile+User.Read+offline_access'
      );
      expect(url).toContain('response_type=code');
      expect(url).toContain('state=test-state');
    });
  });

  describe('exchangeCodeForToken', () => {
    const mockFetch = require('node-fetch');

    it('should exchange code for token successfully', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          access_token: 'test-access-token',
          token_type: 'Bearer',
          expires_in: 3600,
          refresh_token: 'test-refresh-token',
          scope: 'openid email profile',
        }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      const {
        MicrosoftOAuth,
      } = require('../../../src/services/services/microsoft/oauth');
      const oauth = new MicrosoftOAuth();
      (oauth as any).ensureInitialized();

      const result = await oauth.exchangeCodeForToken('test-code');

      expect(result).toEqual({
        access_token: 'test-access-token',
        token_type: 'Bearer',
        expires_in: 3600,
        refresh_token: 'test-refresh-token',
        scope: 'openid email profile',
      });
      expect(mockFetch).toHaveBeenCalledWith(
        'https://login.microsoftonline.com/test-tenant-id/oauth2/v2.0/token',
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
      const mockResponse = {
        ok: false,
        statusText: 'Bad Request',
        text: jest.fn().mockResolvedValue('Invalid code'),
      };
      mockFetch.mockResolvedValue(mockResponse);

      const {
        MicrosoftOAuth,
      } = require('../../../src/services/services/microsoft/oauth');
      const oauth = new MicrosoftOAuth();
      (oauth as any).ensureInitialized();

      await expect(oauth.exchangeCodeForToken('invalid-code')).rejects.toThrow(
        'Microsoft OAuth token exchange failed: Bad Request - Invalid code'
      );
    });

    it('should handle OAuth error responses', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          error: 'invalid_grant',
          error_description: 'The authorization code is invalid',
        }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      const {
        MicrosoftOAuth,
      } = require('../../../src/services/services/microsoft/oauth');
      const oauth = new MicrosoftOAuth();
      (oauth as any).ensureInitialized();

      await expect(oauth.exchangeCodeForToken('invalid-code')).rejects.toThrow(
        'Microsoft OAuth error: invalid_grant'
      );
    });
  });

  describe('getUserInfo', () => {
    const mockFetch = require('node-fetch');

    it('should get user info successfully', async () => {
      const mockUserInfo = {
        id: 'user-id',
        userPrincipalName: 'user@example.com',
        displayName: 'Test User',
        givenName: 'Test',
        surname: 'User',
        mail: 'user@example.com',
      };

      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue(mockUserInfo),
      };
      mockFetch.mockResolvedValue(mockResponse);

      const {
        MicrosoftOAuth,
      } = require('../../../src/services/services/microsoft/oauth');
      const oauth = new MicrosoftOAuth();
      (oauth as any).ensureInitialized();

      const result = await oauth.getUserInfo('test-access-token');

      expect(result).toEqual(mockUserInfo);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://graph.microsoft.com/v1.0/me',
        {
          headers: {
            Authorization: 'Bearer test-access-token',
            Accept: 'application/json',
          },
        }
      );
    });

    it('should handle API errors', async () => {
      const mockResponse = {
        ok: false,
        statusText: 'Unauthorized',
      };
      mockFetch.mockResolvedValue(mockResponse);

      const {
        MicrosoftOAuth,
      } = require('../../../src/services/services/microsoft/oauth');
      const oauth = new MicrosoftOAuth();
      (oauth as any).ensureInitialized();

      await expect(oauth.getUserInfo('invalid-token')).rejects.toThrow(
        'Failed to get Microsoft user info: Unauthorized'
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
        MicrosoftOAuth,
      } = require('../../../src/services/services/microsoft/oauth');
      const oauth = new MicrosoftOAuth();
      (oauth as any).ensureInitialized();

      const tokenData = {
        access_token: 'test-access-token',
        token_type: 'Bearer',
        expires_in: 3600,
        refresh_token: 'test-refresh-token',
        scope: 'openid email profile',
      };

      await oauth.storeUserToken(1, tokenData);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: {
          user_id: 1,
          token_type: 'microsoft_access_token',
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
        MicrosoftOAuth,
      } = require('../../../src/services/services/microsoft/oauth');
      const oauth = new MicrosoftOAuth();
      (oauth as any).ensureInitialized();

      const tokenData = {
        access_token: 'new-access-token',
        token_type: 'Bearer',
        expires_in: 3600,
        scope: 'openid email profile',
      };

      await oauth.storeUserToken(1, tokenData);

      expect(existingToken.token_value).toBe('new-access-token');
      expect(mockRepository.save).toHaveBeenCalledWith(existingToken);
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
        MicrosoftOAuth,
      } = require('../../../src/services/services/microsoft/oauth');
      const oauth = new MicrosoftOAuth();

      const result = await oauth.getUserToken(1);

      expect(result).toBe(validToken);
    });

    it('should return null for expired token', async () => {
      const expiredToken = {
        token_value: 'expired-token',
        expires_at: new Date(Date.now() - 3600000), // 1 hour ago
        is_revoked: false,
      };

      const mockRepository = {
        findOne: jest.fn() as any,
      };
      (AppDataSource.getRepository as any).mockReturnValue(mockRepository);
      mockRepository.findOne.mockResolvedValue(expiredToken);

      const {
        MicrosoftOAuth,
      } = require('../../../src/services/services/microsoft/oauth');
      const oauth = new MicrosoftOAuth();

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
        MicrosoftOAuth,
      } = require('../../../src/services/services/microsoft/oauth');
      const oauth = new MicrosoftOAuth();

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
        MicrosoftOAuth,
      } = require('../../../src/services/services/microsoft/oauth');
      const oauth = new MicrosoftOAuth();

      await oauth.revokeUserToken(1);

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: {
          user_id: 1,
          token_type: 'microsoft_access_token',
        },
      });

      expect(mockRepository.save).toHaveBeenCalledTimes(2);
      tokens.forEach(token => {
        expect(token.is_revoked).toBe(true);
        expect(token.revoked_reason).toBe('User requested revocation');
        expect(token.revoked_at).toBeInstanceOf(Date);
      });
    });
  });
});
