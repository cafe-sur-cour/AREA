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

describe('GitLabOAuth', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    // Set up environment variables
    process.env.SERVICE_GITLAB_CLIENT_ID = 'test-client-id';
    process.env.SERVICE_GITLAB_CLIENT_SECRET = 'test-client-secret';
    process.env.SERVICE_GITLAB_REDIRECT_URI =
      'http://localhost:8080/auth/gitlab/callback';
    process.env.SERVICE_GITLAB_API_BASE_URL = 'https://gitlab.com/api/v4';
    process.env.SERVICE_GITLAB_AUTH_BASE_URL = 'https://gitlab.com';
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('constructor', () => {
    it('should initialize with default values', () => {
      const {
        GitLabOAuth,
      } = require('../../../src/services/services/gitlab/oauth');
      const oauth = new GitLabOAuth();

      expect(oauth).toBeDefined();
    });
  });

  describe('ensureInitialized', () => {
    it('should initialize with environment variables', () => {
      const {
        GitLabOAuth,
      } = require('../../../src/services/services/gitlab/oauth');
      const oauth = new GitLabOAuth();

      expect((oauth as any).clientId).toBe('test-client-id');
      expect((oauth as any).clientSecret).toBe('test-client-secret');
      expect((oauth as any).redirectUri).toBe(
        'http://localhost:8080/auth/gitlab/callback'
      );
      expect((oauth as any).gitlabApiBaseUrl).toBe('https://gitlab.com/api/v4');
      expect((oauth as any).gitlabAuthBaseUrl).toBe('https://gitlab.com');
    });

    it('should warn when required environment variables are missing', () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      // Clear environment variables
      delete process.env.SERVICE_GITLAB_CLIENT_ID;
      delete process.env.SERVICE_GITLAB_CLIENT_SECRET;
      delete process.env.SERVICE_GITLAB_REDIRECT_URI;

      const {
        GitLabOAuth,
      } = require('../../../src/services/services/gitlab/oauth');
      new GitLabOAuth();

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'GitLab OAuth configuration missing - service will not be available'
      );

      consoleWarnSpy.mockRestore();
    });
  });

  describe('getAuthorizationUrl', () => {
    it('should return correct authorization URL', () => {
      const {
        GitLabOAuth,
      } = require('../../../src/services/services/gitlab/oauth');
      const oauth = new GitLabOAuth();

      const state = 'test-state';
      const url = oauth.getAuthorizationUrl(state);

      expect(url).toContain('https://gitlab.com/oauth/authorize');
      expect(url).toContain('client_id=test-client-id');
      expect(url).toContain(
        'redirect_uri=http%3A%2F%2Flocalhost%3A8080%2Fauth%2Fgitlab%2Fcallback'
      );
      // URLSearchParams uses + for spaces, not %20
      expect(url).toContain(
        'scope=api+read_user+read_api+read_repository+write_repository+read_registry+write_registry'
      );
      expect(url).toContain('response_type=code');
      expect(url).toContain('state=test-state');
    });

    it('should throw error when not configured', () => {
      delete process.env.SERVICE_GITLAB_CLIENT_ID;
      delete process.env.SERVICE_GITLAB_CLIENT_SECRET;
      delete process.env.SERVICE_GITLAB_REDIRECT_URI;

      const consoleWarnSpy = jest
        .spyOn(console, 'warn')
        .mockImplementation(() => {});

      const {
        GitLabOAuth,
      } = require('../../../src/services/services/gitlab/oauth');
      const oauth = new GitLabOAuth();

      expect(() => oauth.getAuthorizationUrl('test-state')).toThrow(
        'GitLab OAuth configuration is missing'
      );

      consoleWarnSpy.mockRestore();
    });
  });

  describe('exchangeCodeForToken', () => {
    it('should exchange code for token successfully', async () => {
      const mockResponse = {
        access_token: 'test-access-token',
        token_type: 'bearer',
        scope: 'api read_user',
        expires_in: 3600,
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const {
        GitLabOAuth,
      } = require('../../../src/services/services/gitlab/oauth');
      const oauth = new GitLabOAuth();

      const result = await oauth.exchangeCodeForToken('test-code');

      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://gitlab.com/oauth/token',
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
        GitLabOAuth,
      } = require('../../../src/services/services/gitlab/oauth');
      const oauth = new GitLabOAuth();

      await expect(oauth.exchangeCodeForToken('invalid-code')).rejects.toThrow(
        'GitLab OAuth token exchange failed: Bad Request'
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
        GitLabOAuth,
      } = require('../../../src/services/services/gitlab/oauth');
      const oauth = new GitLabOAuth();

      await expect(oauth.exchangeCodeForToken('invalid-code')).rejects.toThrow(
        'GitLab OAuth error: invalid_grant'
      );
    });
  });

  describe('getUserInfo', () => {
    it('should get user info successfully', async () => {
      const mockUserInfo = {
        id: 12345,
        username: 'testuser',
        name: 'Test User',
        email: 'test@example.com',
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockUserInfo),
      });

      const {
        GitLabOAuth,
      } = require('../../../src/services/services/gitlab/oauth');
      const oauth = new GitLabOAuth();

      const result = await oauth.getUserInfo('test-access-token');

      expect(result).toEqual(mockUserInfo);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://gitlab.com/api/v4/user',
        expect.objectContaining({
          headers: {
            Authorization: 'Bearer test-access-token',
            Accept: 'application/json',
            'User-Agent': 'AREA-App',
          },
        })
      );
    });

    it('should handle errors when fetching user info', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        statusText: 'Unauthorized',
      });

      const {
        GitLabOAuth,
      } = require('../../../src/services/services/gitlab/oauth');
      const oauth = new GitLabOAuth();

      await expect(oauth.getUserInfo('invalid-token')).rejects.toThrow(
        'Failed to get GitLab user info: Unauthorized'
      );
    });
  });

  describe('storeUserToken', () => {
    it('should store new user token', async () => {
      const mockRepository = {
        findOne: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockReturnValue({}),
        save: jest.fn().mockResolvedValue({}),
      };

      const mockGetRepository = jest.fn(() => mockRepository);
      const { AppDataSource } = require('../../../src/config/db');
      AppDataSource.getRepository = mockGetRepository;

      const {
        GitLabOAuth,
      } = require('../../../src/services/services/gitlab/oauth');
      const oauth = new GitLabOAuth();

      const tokenData = {
        access_token: 'test-token',
        token_type: 'bearer',
        scope: 'api read_user',
        expires_in: 3600,
      };

      await oauth.storeUserToken(123, tokenData);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: {
          user_id: 123,
          token_type: 'gitlab_access_token',
        },
      });
      expect(mockRepository.create).toHaveBeenCalled();
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should update existing user token', async () => {
      const existingToken = { token_value: 'old-token' };
      const mockRepository = {
        findOne: jest.fn().mockResolvedValue(existingToken),
        save: jest.fn().mockResolvedValue({}),
      };

      const mockGetRepository = jest.fn(() => mockRepository);
      const { AppDataSource } = require('../../../src/config/db');
      AppDataSource.getRepository = mockGetRepository;

      const {
        GitLabOAuth,
      } = require('../../../src/services/services/gitlab/oauth');
      const oauth = new GitLabOAuth();

      const tokenData = {
        access_token: 'new-token',
        token_type: 'bearer',
        scope: 'api read_user',
      };

      await oauth.storeUserToken(123, tokenData);

      expect(existingToken.token_value).toBe('new-token');
      expect(mockRepository.save).toHaveBeenCalledWith(existingToken);
    });
  });

  describe('getUserToken', () => {
    it('should get user token successfully', async () => {
      const mockToken = {
        token_value: 'test-token',
        expires_at: new Date(Date.now() + 3600000),
      };

      const mockRepository = {
        findOne: jest.fn().mockResolvedValue(mockToken),
      };

      const mockGetRepository = jest.fn(() => mockRepository);
      const { AppDataSource } = require('../../../src/config/db');
      AppDataSource.getRepository = mockGetRepository;

      const {
        GitLabOAuth,
      } = require('../../../src/services/services/gitlab/oauth');
      const oauth = new GitLabOAuth();

      const result = await oauth.getUserToken(123);

      expect(result).toEqual(mockToken);
    });

    it('should return null for expired token', async () => {
      const mockToken = {
        token_value: 'test-token',
        expires_at: new Date(Date.now() - 3600000), // Expired
      };

      const mockRepository = {
        findOne: jest.fn().mockResolvedValue(mockToken),
      };

      const mockGetRepository = jest.fn(() => mockRepository);
      const { AppDataSource } = require('../../../src/config/db');
      AppDataSource.getRepository = mockGetRepository;

      const {
        GitLabOAuth,
      } = require('../../../src/services/services/gitlab/oauth');
      const oauth = new GitLabOAuth();

      const result = await oauth.getUserToken(123);

      expect(result).toBeNull();
    });

    it('should return null when token not found', async () => {
      const mockRepository = {
        findOne: jest.fn().mockResolvedValue(null),
      };

      const mockGetRepository = jest.fn(() => mockRepository);
      const { AppDataSource } = require('../../../src/config/db');
      AppDataSource.getRepository = mockGetRepository;

      const {
        GitLabOAuth,
      } = require('../../../src/services/services/gitlab/oauth');
      const oauth = new GitLabOAuth();

      const result = await oauth.getUserToken(123);

      expect(result).toBeNull();
    });
  });

  describe('revokeUserToken', () => {
    it('should revoke user token', async () => {
      const mockToken = {
        is_revoked: false,
        revoked_at: null,
        revoked_reason: null,
      };

      const mockRepository = {
        findOne: jest.fn().mockResolvedValue(mockToken),
        save: jest.fn().mockResolvedValue({}),
      };

      const mockGetRepository = jest.fn(() => mockRepository);
      const { AppDataSource } = require('../../../src/config/db');
      AppDataSource.getRepository = mockGetRepository;

      const {
        GitLabOAuth,
      } = require('../../../src/services/services/gitlab/oauth');
      const oauth = new GitLabOAuth();

      await oauth.revokeUserToken(123);

      expect(mockToken.is_revoked).toBe(true);
      expect(mockToken.revoked_reason).toBe('User requested revocation');
      expect(mockRepository.save).toHaveBeenCalledWith(mockToken);
    });

    it('should handle revoking non-existent token gracefully', async () => {
      const mockRepository = {
        findOne: jest.fn().mockResolvedValue(null),
        save: jest.fn(),
      };

      const mockGetRepository = jest.fn(() => mockRepository);
      const { AppDataSource } = require('../../../src/config/db');
      AppDataSource.getRepository = mockGetRepository;

      const {
        GitLabOAuth,
      } = require('../../../src/services/services/gitlab/oauth');
      const oauth = new GitLabOAuth();

      await expect(oauth.revokeUserToken(123)).resolves.not.toThrow();
      expect(mockRepository.save).not.toHaveBeenCalled();
    });
  });
});
