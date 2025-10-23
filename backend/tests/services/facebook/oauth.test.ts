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

describe('FacebookOAuth', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    process.env.SERVICE_FACEBOOK_CLIENT_ID = 'test-client-id';
    process.env.SERVICE_FACEBOOK_CLIENT_SECRET = 'test-client-secret';
    process.env.SERVICE_FACEBOOK_REDIRECT_URI =
      'http://localhost:8080/auth/facebook/callback';
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('constructor', () => {
    it('should initialize with default values', () => {
      const {
        FacebookOAuth,
      } = require('../../../src/services/services/facebook/oauth');
      const oauth = new FacebookOAuth();

      expect(oauth).toBeDefined();
    });

    it('should throw error when required environment variables are missing', () => {
      // Temporarily clear environment variables
      const originalClientId = process.env.SERVICE_FACEBOOK_CLIENT_ID;
      const originalClientSecret = process.env.SERVICE_FACEBOOK_CLIENT_SECRET;
      const originalRedirectUri = process.env.SERVICE_FACEBOOK_REDIRECT_URI;

      delete process.env.SERVICE_FACEBOOK_CLIENT_ID;
      delete process.env.SERVICE_FACEBOOK_CLIENT_SECRET;
      delete process.env.SERVICE_FACEBOOK_REDIRECT_URI;

      expect(() => {
        const {
          FacebookOAuth,
        } = require('../../../src/services/services/facebook/oauth');
        new FacebookOAuth();
      }).toThrow('Facebook OAuth configuration missing');

      // Restore environment variables
      process.env.SERVICE_FACEBOOK_CLIENT_ID = originalClientId;
      process.env.SERVICE_FACEBOOK_CLIENT_SECRET = originalClientSecret;
      process.env.SERVICE_FACEBOOK_REDIRECT_URI = originalRedirectUri;
    });
  });

  describe('getAuthorizationUrl', () => {
    it('should return correct authorization URL', () => {
      const {
        FacebookOAuth,
      } = require('../../../src/services/services/facebook/oauth');
      const oauth = new FacebookOAuth();

      const state = 'test-state';
      const url = oauth.getAuthorizationUrl(state);

      expect(url).toContain('https://www.facebook.com/v18.0/dialog/oauth');
      expect(url).toContain('client_id=test-client-id');
      expect(url).toContain(
        'redirect_uri=http%3A%2F%2Flocalhost%3A8080%2Fauth%2Ffacebook%2Fcallback'
      );
      expect(url).toContain('scope=email%2Cpublic_profile');
      expect(url).toContain('response_type=code');
      expect(url).toContain('state=test-state');
    });
  });

  describe('exchangeCodeForToken', () => {
    it('should exchange code for token successfully', async () => {
      const mockResponse = {
        access_token: 'test-access-token',
        token_type: 'bearer',
        expires_in: 5184000,
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as any);

      const {
        FacebookOAuth,
      } = require('../../../src/services/services/facebook/oauth');
      const oauth = new FacebookOAuth();

      const result = await oauth.exchangeCodeForToken('test-code');

      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://graph.facebook.com/v18.0/oauth/access_token?client_id=test-client-id&redirect_uri=http%3A%2F%2Flocalhost%3A8080%2Fauth%2Ffacebook%2Fcallback&client_secret=test-client-secret&code=test-code',
        {
          method: 'GET',
          headers: {
            Accept: 'application/json',
          },
        }
      );
    });

    it('should handle API errors', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        statusText: 'Bad Request',
      });

      const {
        FacebookOAuth,
      } = require('../../../src/services/services/facebook/oauth');
      const oauth = new FacebookOAuth();

      await expect(oauth.exchangeCodeForToken('invalid-code')).rejects.toThrow(
        'Facebook OAuth token exchange failed: Bad Request'
      );
    });

    it('should handle Facebook error responses', async () => {
      const mockResponse = {
        error: {
          message: 'Invalid OAuth access token.',
          type: 'OAuthException',
          code: 190,
          fbtrace_id: 'test-trace-id',
        },
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const {
        FacebookOAuth,
      } = require('../../../src/services/services/facebook/oauth');
      const oauth = new FacebookOAuth();

      await expect(oauth.exchangeCodeForToken('invalid-code')).rejects.toThrow(
        'Facebook OAuth error: Invalid OAuth access token.'
      );
    });
  });

  describe('getUserInfo', () => {
    it('should get user info successfully', async () => {
      const mockUserInfo = {
        id: '12345',
        name: 'Test User',
        email: 'test@example.com',
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockUserInfo),
      });

      const {
        FacebookOAuth,
      } = require('../../../src/services/services/facebook/oauth');
      const oauth = new FacebookOAuth();

      const result = await oauth.getUserInfo('test-access-token');

      expect(result).toEqual(mockUserInfo);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://graph.facebook.com/me?access_token=test-access-token&fields=id%2Cname%2Cemail',
        {
          method: 'GET',
          headers: {
            Accept: 'application/json',
          },
        }
      );
    });

    it('should handle API errors', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        statusText: 'Unauthorized',
      });

      const {
        FacebookOAuth,
      } = require('../../../src/services/services/facebook/oauth');
      const oauth = new FacebookOAuth();

      await expect(oauth.getUserInfo('invalid-token')).rejects.toThrow(
        'Failed to get Facebook user info: Unauthorized'
      );
    });
  });

  describe('storeUserToken', () => {
    const { AppDataSource } = require('../../../src/config/db');

    it('should store new access token', async () => {
      const mockRepository = {
        findOne: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockReturnValue({}),
        save: jest.fn().mockResolvedValue({}),
      } as any;
      (AppDataSource.getRepository as any).mockReturnValue(mockRepository);

      const {
        FacebookOAuth,
      } = require('../../../src/services/services/facebook/oauth');
      const oauth = new FacebookOAuth();

      const tokenData = {
        access_token: 'test-access-token',
        token_type: 'bearer',
        expires_in: 5184000,
      };

      await oauth.storeUserToken(1, tokenData);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: {
          user_id: 1,
          token_type: 'facebook_access_token',
        },
      });
      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 1,
          token_type: 'facebook_access_token',
          token_value: 'test-access-token',
          scopes: ['email', 'public_profile'],
        })
      );
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should update existing access token', async () => {
      const existingToken = {
        token_value: 'old-token',
        scopes: [],
      };
      const mockRepository = {
        findOne: jest.fn().mockResolvedValue(existingToken),
        save: jest.fn().mockResolvedValue({}),
      } as any;
      (AppDataSource.getRepository as any).mockReturnValue(mockRepository);

      const {
        FacebookOAuth,
      } = require('../../../src/services/services/facebook/oauth');
      const oauth = new FacebookOAuth();

      const tokenData = {
        access_token: 'new-access-token',
        token_type: 'bearer',
        expires_in: 5184000,
      };

      await oauth.storeUserToken(1, tokenData);

      expect(existingToken.token_value).toBe('new-access-token');
      expect(existingToken.scopes).toEqual(['email', 'public_profile']);
      expect(mockRepository.save).toHaveBeenCalledWith(existingToken);
    });
  });

  describe('getUserToken', () => {
    const { AppDataSource } = require('../../../src/config/db');

    it('should return valid token', async () => {
      const validToken = {
        token_value: 'valid-token',
        expires_at: null,
        is_revoked: false,
      };

      const mockRepository = {
        findOne: jest.fn().mockResolvedValue(validToken),
      } as any;
      (AppDataSource.getRepository as any).mockReturnValue(mockRepository);

      const {
        FacebookOAuth,
      } = require('../../../src/services/services/facebook/oauth');
      const oauth = new FacebookOAuth();

      const result = await oauth.getUserToken(1);

      expect(result).toBe(validToken);
    });

    it('should return null when no token found', async () => {
      const mockRepository = {
        findOne: jest.fn().mockResolvedValue(null),
      } as any;
      (AppDataSource.getRepository as any).mockReturnValue(mockRepository);

      const {
        FacebookOAuth,
      } = require('../../../src/services/services/facebook/oauth');
      const oauth = new FacebookOAuth();

      const result = await oauth.getUserToken(1);

      expect(result).toBeNull();
    });

    it('should return null for expired token', async () => {
      const expiredToken = {
        token_value: 'expired-token',
        expires_at: new Date(Date.now() - 3600000), // 1 hour ago
        is_revoked: false,
      };

      const mockRepository = {
        findOne: jest.fn().mockResolvedValue(expiredToken),
      } as any;
      (AppDataSource.getRepository as any).mockReturnValue(mockRepository);

      const {
        FacebookOAuth,
      } = require('../../../src/services/services/facebook/oauth');
      const oauth = new FacebookOAuth();

      const result = await oauth.getUserToken(1);

      expect(result).toBeNull();
    });
  });

  describe('revokeUserToken', () => {
    const { AppDataSource } = require('../../../src/config/db');

    it('should revoke user token', async () => {
      const mockToken = {
        is_revoked: false,
        revoked_at: null,
        revoked_reason: null,
      };

      const mockRepository = {
        findOne: jest.fn().mockResolvedValue(mockToken),
        save: jest.fn().mockResolvedValue({}),
      } as any;
      (AppDataSource.getRepository as any).mockReturnValue(mockRepository);

      const {
        FacebookOAuth,
      } = require('../../../src/services/services/facebook/oauth');
      const oauth = new FacebookOAuth();

      await oauth.revokeUserToken(1);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: {
          user_id: 1,
          token_type: 'facebook_access_token',
        },
      });
      expect(mockToken.is_revoked).toBe(true);
      expect(mockToken.revoked_reason).toBe('User requested revocation');
      expect(mockToken.revoked_at).toBeInstanceOf(Date);
      expect(mockRepository.save).toHaveBeenCalledWith(mockToken);
    });

    it('should handle when no token found', async () => {
      const mockRepository = {
        findOne: jest.fn().mockResolvedValue(null),
        save: jest.fn().mockResolvedValue({}),
      } as any;
      (AppDataSource.getRepository as any).mockReturnValue(mockRepository);

      const {
        FacebookOAuth,
      } = require('../../../src/services/services/facebook/oauth');
      const oauth = new FacebookOAuth();

      await oauth.revokeUserToken(1);

      expect(mockRepository.save).not.toHaveBeenCalled();
    });
  });
});
