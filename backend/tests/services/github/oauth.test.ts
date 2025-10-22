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

describe('GitHubOAuth', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    // Set up environment variables
    process.env.SERVICE_GITHUB_CLIENT_ID = 'test-client-id';
    process.env.SERVICE_GITHUB_CLIENT_SECRET = 'test-client-secret';
    process.env.SERVICE_GITHUB_REDIRECT_URI =
      'http://localhost:8080/auth/github/callback';
    process.env.SERVICE_GITHUB_API_BASE_URL = 'https://api.github.com';
    process.env.SERVICE_GITHUB_AUTH_BASE_URL = 'https://github.com';
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('constructor', () => {
    it('should initialize with default values', () => {
      const {
        GitHubOAuth,
      } = require('../../../src/services/services/github/oauth');
      const oauth = new GitHubOAuth();

      expect(oauth).toBeDefined();
    });
  });

  describe('ensureInitialized', () => {
    it('should initialize with environment variables', () => {
      const {
        GitHubOAuth,
      } = require('../../../src/services/services/github/oauth');
      const oauth = new GitHubOAuth();
      (oauth as any).ensureInitialized();

      expect((oauth as any).clientId).toBe('test-client-id');
      expect((oauth as any).clientSecret).toBe('test-client-secret');
      expect((oauth as any).redirectUri).toBe(
        'http://localhost:8080/auth/github/callback'
      );
      expect((oauth as any).githubApiBaseUrl).toBe('https://api.github.com');
      expect((oauth as any).githubAuthBaseUrl).toBe('https://github.com');
    });

    it('should throw error when required environment variables are missing', () => {
      // Temporarily clear environment variables
      const originalClientId = process.env.SERVICE_GITHUB_CLIENT_ID;
      const originalClientSecret = process.env.SERVICE_GITHUB_CLIENT_SECRET;
      const originalRedirectUri = process.env.SERVICE_GITHUB_REDIRECT_URI;

      delete process.env.SERVICE_GITHUB_CLIENT_ID;
      delete process.env.SERVICE_GITHUB_CLIENT_SECRET;
      delete process.env.SERVICE_GITHUB_REDIRECT_URI;

      expect(() => {
        new (require('../../../src/services/services/github/oauth').GitHubOAuth)();
      }).toThrow('GitHub OAuth configuration missing');

      // Restore environment variables
      process.env.SERVICE_GITHUB_CLIENT_ID = originalClientId;
      process.env.SERVICE_GITHUB_CLIENT_SECRET = originalClientSecret;
      process.env.SERVICE_GITHUB_REDIRECT_URI = originalRedirectUri;
    });
  });

  describe('getAuthorizationUrl', () => {
    it('should return correct authorization URL', () => {
      const {
        GitHubOAuth,
      } = require('../../../src/services/services/github/oauth');
      const oauth = new GitHubOAuth();
      (oauth as any).ensureInitialized();

      const state = 'test-state';
      const url = oauth.getAuthorizationUrl(state);

      expect(url).toContain('https://github.com/login/oauth/authorize');
      expect(url).toContain('client_id=test-client-id');
      expect(url).toContain(
        'redirect_uri=http%3A%2F%2Flocalhost%3A8080%2Fauth%2Fgithub%2Fcallback'
      );
      expect(url).toContain('scope=repo%2Cuser');
      expect(url).toContain('response_type=code');
      expect(url).toContain('state=test-state');
    });
  });

  describe('exchangeCodeForToken', () => {
    it('should exchange code for token successfully', async () => {
      const mockResponse = {
        access_token: 'test-access-token',
        token_type: 'bearer',
        scope: 'user:email,repo',
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const {
        GitHubOAuth,
      } = require('../../../src/services/services/github/oauth');
      const oauth = new GitHubOAuth();
      (oauth as any).ensureInitialized();

      const result = await oauth.exchangeCodeForToken('test-code');

      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://github.com/login/oauth/access_token',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
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
        GitHubOAuth,
      } = require('../../../src/services/services/github/oauth');
      const oauth = new GitHubOAuth();
      (oauth as any).ensureInitialized();

      await expect(oauth.exchangeCodeForToken('invalid-code')).rejects.toThrow(
        'GitHub OAuth token exchange failed: Bad Request'
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
      });

      const {
        GitHubOAuth,
      } = require('../../../src/services/services/github/oauth');
      const oauth = new GitHubOAuth();
      (oauth as any).ensureInitialized();

      await expect(oauth.exchangeCodeForToken('invalid-code')).rejects.toThrow(
        'GitHub OAuth error: invalid_grant'
      );
    });
  });

  describe('getUserInfo', () => {
    it('should get user info successfully', async () => {
      const mockUserInfo = {
        id: 12345,
        login: 'testuser',
        name: 'Test User',
        email: 'test@example.com',
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockUserInfo),
      });

      const {
        GitHubOAuth,
      } = require('../../../src/services/services/github/oauth');
      const oauth = new GitHubOAuth();
      (oauth as any).ensureInitialized();

      const result = await oauth.getUserInfo('test-access-token');

      expect(result).toEqual(mockUserInfo);
      expect(mockFetch).toHaveBeenCalledWith('https://api.github.com/user', {
        headers: {
          Authorization: 'Bearer test-access-token',
          Accept: 'application/vnd.github.v3+json',
          'User-Agent': 'AREA-App',
        },
      });
    });

    it('should handle API errors', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        statusText: 'Unauthorized',
      });

      const {
        GitHubOAuth,
      } = require('../../../src/services/services/github/oauth');
      const oauth = new GitHubOAuth();
      (oauth as any).ensureInitialized();

      await expect(oauth.getUserInfo('invalid-token')).rejects.toThrow(
        'Failed to get GitHub user info: Unauthorized'
      );
    });
  });

  describe('getUserEmails', () => {
    it('should get user emails successfully', async () => {
      const mockEmails = [
        {
          email: 'test@example.com',
          verified: true,
          primary: true,
          visibility: 'public',
        },
        {
          email: 'test@github.oauth',
          verified: false,
          primary: false,
          visibility: null,
        },
      ];

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockEmails),
      });

      const {
        GitHubOAuth,
      } = require('../../../src/services/services/github/oauth');
      const oauth = new GitHubOAuth();
      (oauth as any).ensureInitialized();

      const result = await oauth.getUserEmails('test-access-token');

      expect(result).toEqual(mockEmails);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.github.com/user/emails',
        {
          headers: {
            Authorization: 'token test-access-token',
            Accept: 'application/vnd.github.v3+json',
            'User-Agent': 'AREA-App',
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
        GitHubOAuth,
      } = require('../../../src/services/services/github/oauth');
      const oauth = new GitHubOAuth();
      (oauth as any).ensureInitialized();

      await expect(oauth.getUserEmails('invalid-token')).rejects.toThrow(
        'Failed to get GitHub user emails: Unauthorized'
      );
    });
  });

  describe('storeUserToken', () => {
    const { AppDataSource } = require('../../../src/config/db');

    it('should store new access token', async () => {
      const mockRepository = {
        findOne: jest.fn().mockResolvedValue(null) as any,
        create: jest.fn().mockReturnValue({}) as any,
        save: jest.fn().mockResolvedValue({}) as any,
      };
      (AppDataSource.getRepository as any).mockReturnValue(mockRepository);

      const {
        GitHubOAuth,
      } = require('../../../src/services/services/github/oauth');
      const oauth = new GitHubOAuth();
      (oauth as any).ensureInitialized();

      const tokenData = {
        access_token: 'test-access-token',
        token_type: 'bearer',
        scope: 'user:email,repo',
      };

      await oauth.storeUserToken(1, tokenData);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: {
          user_id: 1,
          token_type: 'github_access_token',
        },
      });
      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 1,
          token_type: 'github_access_token',
          token_value: 'test-access-token',
          scopes: expect.arrayContaining(['user:email', 'repo']),
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
        findOne: jest.fn().mockResolvedValue(existingToken) as any,
        save: jest.fn().mockResolvedValue({}) as any,
      };
      (AppDataSource.getRepository as any).mockReturnValue(mockRepository);

      const {
        GitHubOAuth,
      } = require('../../../src/services/services/github/oauth');
      const oauth = new GitHubOAuth();
      (oauth as any).ensureInitialized();

      const tokenData = {
        access_token: 'new-access-token',
        token_type: 'bearer',
        scope: 'user:email',
      };

      await oauth.storeUserToken(1, tokenData);

      expect(existingToken.token_value).toBe('new-access-token');
      expect(existingToken.scopes).toEqual(['user:email']);
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
        findOne: jest.fn().mockResolvedValue(validToken) as any,
      };
      (AppDataSource.getRepository as any).mockReturnValue(mockRepository);

      const {
        GitHubOAuth,
      } = require('../../../src/services/services/github/oauth');
      const oauth = new GitHubOAuth();

      const result = await oauth.getUserToken(1);

      expect(result).toBe(validToken);
    });

    it('should return null when no token found', async () => {
      const mockRepository = {
        findOne: jest.fn().mockResolvedValue(null) as any,
      };
      (AppDataSource.getRepository as any).mockReturnValue(mockRepository);

      const {
        GitHubOAuth,
      } = require('../../../src/services/services/github/oauth');
      const oauth = new GitHubOAuth();

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
        findOne: jest.fn().mockResolvedValue(expiredToken) as any,
      };
      (AppDataSource.getRepository as any).mockReturnValue(mockRepository);

      const {
        GitHubOAuth,
      } = require('../../../src/services/services/github/oauth');
      const oauth = new GitHubOAuth();

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
        findOne: jest.fn().mockResolvedValue(mockToken) as any,
        save: jest.fn().mockResolvedValue({}) as any,
      };
      (AppDataSource.getRepository as any).mockReturnValue(mockRepository);

      const {
        GitHubOAuth,
      } = require('../../../src/services/services/github/oauth');
      const oauth = new GitHubOAuth();

      await oauth.revokeUserToken(1);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: {
          user_id: 1,
          token_type: 'github_access_token',
        },
      });
      expect(mockToken.is_revoked).toBe(true);
      expect(mockToken.revoked_reason).toBe('User requested revocation');
      expect(mockToken.revoked_at).toBeInstanceOf(Date);
      expect(mockRepository.save).toHaveBeenCalledWith(mockToken);
    });

    it('should handle when no token found', async () => {
      const mockRepository = {
        findOne: jest.fn().mockResolvedValue(null) as any,
        save: jest.fn().mockResolvedValue({}) as any,
      };
      (AppDataSource.getRepository as any).mockReturnValue(mockRepository);

      const {
        GitHubOAuth,
      } = require('../../../src/services/services/github/oauth');
      const oauth = new GitHubOAuth();

      await oauth.revokeUserToken(1);

      expect(mockRepository.save).not.toHaveBeenCalled();
    });
  });
});
