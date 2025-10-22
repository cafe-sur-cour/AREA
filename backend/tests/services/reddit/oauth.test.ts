// Set environment variables FIRST, before any imports
process.env.SERVICE_REDDIT_CLIENT_ID = 'test_client_id';
process.env.SERVICE_REDDIT_CLIENT_SECRET = 'test_client_secret';
process.env.SERVICE_REDDIT_REDIRECT_URI = 'http://localhost:3000/callback';
process.env.SERVICE_REDDIT_API_BASE_URL = 'https://www.reddit.com';
process.env.SERVICE_REDDIT_AUTH_API_BASE_URL = 'https://oauth.reddit.com';

// Mock node-fetch BEFORE importing the module
const mockFetch = jest.fn();
jest.mock('node-fetch', () => mockFetch);

// Mock AppDataSource
jest.mock('../../../src/config/db', () => ({
  AppDataSource: {
    getRepository: jest.fn(),
  },
}));

import { RedditOAuth } from '../../../src/services/services/reddit/oauth';
import { AppDataSource } from '../../../src/config/db';

describe('Reddit OAuth', () => {
  let redditOAuth: RedditOAuth;
  let mockTokenRepository: any;

  beforeEach(() => {
    jest.clearAllMocks();

    redditOAuth = new RedditOAuth();

    mockTokenRepository = {
      findOne: jest.fn(),
      create: jest.fn(data => data),
      save: jest.fn(),
    };

    (AppDataSource.getRepository as jest.Mock).mockReturnValue(
      mockTokenRepository
    );
  });

  afterAll(() => {
    delete process.env.SERVICE_REDDIT_CLIENT_ID;
    delete process.env.SERVICE_REDDIT_CLIENT_SECRET;
    delete process.env.SERVICE_REDDIT_REDIRECT_URI;
    delete process.env.SERVICE_REDDIT_API_BASE_URL;
    delete process.env.SERVICE_REDDIT_AUTH_API_BASE_URL;
  });

  describe('constructor', () => {
    it('should throw error when environment variables are missing', () => {
      delete process.env.SERVICE_REDDIT_CLIENT_ID;
      expect(() => new RedditOAuth()).toThrow(
        'Reddit OAuth configuration missing'
      );
      process.env.SERVICE_REDDIT_CLIENT_ID = 'test_client_id';
    });

    it('should initialize with correct configuration', () => {
      const oauth = new RedditOAuth();
      expect(oauth).toBeDefined();
    });
  });

  describe('getAuthorizationUrl', () => {
    it('should generate correct authorization URL', () => {
      const state = 'random_state_123';
      const url = redditOAuth.getAuthorizationUrl(state);

      expect(url).toContain('https://www.reddit.com/api/v1/authorize');
      expect(url).toContain(`client_id=test_client_id`);
      expect(url).toContain(
        `redirect_uri=${encodeURIComponent('http://localhost:3000/callback')}`
      );
      expect(url).toContain(`state=${state}`);
      expect(url).toContain('duration=permanent');
    });

    it('should include correct scopes in authorization URL', () => {
      const state = 'test_state';
      const url = redditOAuth.getAuthorizationUrl(state);

      expect(url).toContain('scope=');
      expect(url).toContain('identity');
      expect(url).toContain('read');
    });
  });

  describe('exchangeCodeForToken', () => {
    it('should exchange authorization code for tokens', async () => {
      const mockResponse = {
        access_token: 'test_access_token',
        token_type: 'bearer',
        expires_in: 3600,
        scope: 'identity read',
        refresh_token: 'test_refresh_token',
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as any);

      const result = await redditOAuth.exchangeCodeForToken('test_code');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://www.reddit.com/api/v1/access_token',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'AREA-App/1.0',
          }),
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it('should handle token exchange errors', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        statusText: 'Bad Request',
      } as any);

      await expect(
        redditOAuth.exchangeCodeForToken('invalid_code')
      ).rejects.toThrow('Reddit OAuth token exchange failed');
    });

    it('should handle Reddit API errors', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ error: 'invalid_grant' }),
      } as any);

      await expect(
        redditOAuth.exchangeCodeForToken('test_code')
      ).rejects.toThrow('Reddit OAuth error: invalid_grant');
    });
  });

  describe('getUserInfo', () => {
    it('should get user info successfully', async () => {
      const mockUser = {
        id: 'user123',
        name: 'testuser',
        created: 1609459200,
        comment_karma: 100,
        link_karma: 50,
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockUser),
      } as any);

      const result = await redditOAuth.getUserInfo('test_access_token');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://oauth.reddit.com/api/v1/me',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test_access_token',
            'User-Agent': 'AREA-App/1.0',
          }),
        })
      );
      expect(result).toEqual(mockUser);
    });

    it('should handle user info fetch failure', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        statusText: 'Unauthorized',
      } as any);

      await expect(redditOAuth.getUserInfo('invalid_token')).rejects.toThrow(
        'Failed to get Reddit user info'
      );
    });
  });

  describe('storeUserToken', () => {
    it('should create new token when none exists', async () => {
      mockTokenRepository.findOne.mockResolvedValue(null);

      const tokenData = {
        access_token: 'test_access',
        token_type: 'bearer',
        expires_in: 3600,
        scope: 'identity read',
        refresh_token: 'test_refresh',
      };

      await redditOAuth.storeUserToken(1, tokenData);

      expect(mockTokenRepository.findOne).toHaveBeenCalledWith({
        where: {
          user_id: 1,
          token_type: 'reddit_access_token',
        },
      });
      expect(mockTokenRepository.create).toHaveBeenCalled();
      expect(mockTokenRepository.save).toHaveBeenCalled();
    });

    it('should update existing token', async () => {
      const existingToken = {
        user_id: 1,
        token_type: 'reddit_access_token',
        token_value: 'old_token',
        scopes: [],
      };

      mockTokenRepository.findOne.mockResolvedValue(existingToken);

      const tokenData = {
        access_token: 'new_access',
        token_type: 'bearer',
        expires_in: 3600,
        scope: 'identity read',
        refresh_token: 'new_refresh',
      };

      await redditOAuth.storeUserToken(1, tokenData);

      expect(mockTokenRepository.save).toHaveBeenCalled();
    });
  });

  describe('getUserToken', () => {
    it('should retrieve user token', async () => {
      const mockToken = {
        user_id: 1,
        token_type: 'reddit_access_token',
        token_value: 'encrypted_token',
        is_revoked: false,
      };

      mockTokenRepository.findOne.mockResolvedValue(mockToken);

      const result = await redditOAuth.getUserToken(1);

      expect(mockTokenRepository.findOne).toHaveBeenCalledWith({
        where: {
          user_id: 1,
          token_type: 'reddit_access_token',
          is_revoked: false,
        },
      });
      expect(result).toEqual(mockToken);
    });

    it('should return null when no token found', async () => {
      mockTokenRepository.findOne.mockResolvedValue(null);

      const result = await redditOAuth.getUserToken(1);

      expect(result).toBeNull();
    });
  });

  describe('revokeUserToken', () => {
    it('should revoke user token', async () => {
      const mockToken = {
        user_id: 1,
        token_type: 'reddit_access_token',
        token_value: 'token',
        is_revoked: false,
        revoked_at: undefined as Date | undefined,
        revoked_reason: undefined as string | undefined,
      };

      mockTokenRepository.findOne.mockResolvedValue(mockToken);

      await redditOAuth.revokeUserToken(1);

      expect(mockTokenRepository.findOne).toHaveBeenCalled();
      expect(mockTokenRepository.save).toHaveBeenCalled();
      expect(mockToken.is_revoked).toBe(true);
    });

    it('should handle when no token found to revoke', async () => {
      mockTokenRepository.findOne.mockResolvedValue(null);

      await redditOAuth.revokeUserToken(1);

      expect(mockTokenRepository.save).not.toHaveBeenCalled();
    });
  });
});
