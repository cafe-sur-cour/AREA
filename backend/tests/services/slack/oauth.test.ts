// Set environment variables FIRST, before any imports
process.env.SERVICE_SLACK_CLIENT_ID = 'test_client_id';
process.env.SERVICE_SLACK_CLIENT_SECRET = 'test_client_secret';
process.env.SERVICE_SLACK_REDIRECT_URI = 'http://localhost:3000/callback';

// Mock node-fetch BEFORE importing the module
const mockFetch = jest.fn();
jest.mock('node-fetch', () => mockFetch);

// Mock AppDataSource
jest.mock('../../../src/config/db', () => ({
  AppDataSource: {
    getRepository: jest.fn(),
  },
}));

import { SlackOAuth } from '../../../src/services/services/slack/oauth';
import { AppDataSource } from '../../../src/config/db';

describe('Slack OAuth', () => {
  let slackOAuth: SlackOAuth;
  let mockTokenRepository: any;

  beforeEach(() => {
    jest.clearAllMocks();

    slackOAuth = new SlackOAuth();

    mockTokenRepository = {
      findOne: jest.fn(),
      create: jest.fn(data => data),
      save: jest.fn(),
      find: jest.fn(),
    };

    (AppDataSource.getRepository as jest.Mock).mockReturnValue(
      mockTokenRepository
    );
  });

  afterAll(() => {
    delete process.env.SERVICE_SLACK_CLIENT_ID;
    delete process.env.SERVICE_SLACK_CLIENT_SECRET;
    delete process.env.SERVICE_SLACK_REDIRECT_URI;
  });

  describe('constructor', () => {
    it('should throw error when environment variables are missing', () => {
      delete process.env.SERVICE_SLACK_CLIENT_ID;
      expect(() => new SlackOAuth()).toThrow(
        'Slack OAuth configuration missing'
      );
      process.env.SERVICE_SLACK_CLIENT_ID = 'test_client_id';
    });

    it('should initialize with correct configuration', () => {
      const oauth = new SlackOAuth();
      expect(oauth).toBeDefined();
    });
  });

  describe('getAuthorizationUrl', () => {
    it('should generate correct authorization URL', () => {
      const state = 'random_state_123';
      const url = slackOAuth.getAuthorizationUrl(state);

      expect(url).toContain('https://slack.com/oauth/v2/authorize');
      expect(url).toContain(`client_id=test_client_id`);
      expect(url).toContain(
        `redirect_uri=${encodeURIComponent('http://localhost:3000/callback')}`
      );
      expect(url).toContain(`state=${state}`);
    });

    it('should include correct scopes in authorization URL', () => {
      const state = 'test_state';
      const url = slackOAuth.getAuthorizationUrl(state);

      // Scopes are URL encoded (: becomes %3A, , becomes %2C)
      expect(url).toContain('scope=');
      expect(url).toContain('channels');
      expect(url).toContain('read');
      expect(url).toContain('chat');
      expect(url).toContain('write');
    });
  });

  describe('exchangeCodeForToken', () => {
    it('should exchange authorization code for tokens', async () => {
      const mockResponse = {
        ok: true,
        access_token: 'xoxb-test-token',
        token_type: 'bot',
        scope: 'channels:read,chat:write',
        bot_user_id: 'B123',
        team: { id: 'T123', name: 'Test Team' },
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as any);

      const result = await slackOAuth.exchangeCodeForToken('test_code');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://slack.com/api/oauth.v2.access',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
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
        slackOAuth.exchangeCodeForToken('invalid_code')
      ).rejects.toThrow('Slack OAuth token exchange failed');
    });

    it('should handle Slack API errors', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ ok: false, error: 'invalid_code' }),
      } as any);

      await expect(
        slackOAuth.exchangeCodeForToken('test_code')
      ).rejects.toThrow('Slack OAuth error: invalid_code');
    });
  });

  describe('getUserInfo', () => {
    it('should get user info successfully', async () => {
      const authTestResponse = {
        ok: true,
        user_id: 'U123',
      };

      const userInfoResponse = {
        ok: true,
        user: {
          id: 'U123',
          name: 'testuser',
          real_name: 'Test User',
          profile: {
            email: 'test@example.com',
            display_name: 'Test',
          },
        },
      };

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(authTestResponse),
        } as any)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(userInfoResponse),
        } as any);

      const result = await slackOAuth.getUserInfo('xoxb-test-token');

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(result).toEqual(userInfoResponse);
    });

    it('should handle auth test failure', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        statusText: 'Unauthorized',
      } as any);

      await expect(slackOAuth.getUserInfo('invalid_token')).rejects.toThrow(
        'Failed to authenticate with Slack'
      );
    });

    it('should handle auth test error response', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ ok: false, error: 'invalid_auth' }),
      } as any);

      await expect(slackOAuth.getUserInfo('invalid_token')).rejects.toThrow(
        'Slack auth test error: invalid_auth'
      );
    });

    it('should handle user info fetch failure', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ ok: true, user_id: 'U123' }),
        } as any)
        .mockResolvedValueOnce({
          ok: false,
          statusText: 'Not Found',
        } as any);

      await expect(slackOAuth.getUserInfo('xoxb-test-token')).rejects.toThrow(
        'Failed to get Slack user info'
      );
    });
  });

  describe('storeUserToken', () => {
    it('should create new token when none exists', async () => {
      mockTokenRepository.findOne.mockResolvedValue(null);

      const tokenData = {
        access_token: 'xoxb-token',
        token_type: 'bot',
        scope: 'channels:read,chat:write',
        ok: true,
      };

      await slackOAuth.storeUserToken(1, tokenData);

      expect(mockTokenRepository.findOne).toHaveBeenCalledWith({
        where: {
          user_id: 1,
          token_type: 'slack_access_token',
        },
      });
      expect(mockTokenRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 1,
          token_type: 'slack_access_token',
          scopes: ['channels:read', 'chat:write'],
        })
      );
      expect(mockTokenRepository.save).toHaveBeenCalled();
    });

    it('should update existing token', async () => {
      const existingToken = {
        user_id: 1,
        token_type: 'slack_access_token',
        token_value: 'old_encrypted_token',
        scopes: [],
      };

      mockTokenRepository.findOne.mockResolvedValue(existingToken);

      const tokenData = {
        access_token: 'xoxb-new-token',
        token_type: 'bot',
        scope: 'channels:read',
        ok: true,
      };

      await slackOAuth.storeUserToken(1, tokenData);

      expect(mockTokenRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 1,
          token_type: 'slack_access_token',
        })
      );
    });

    it('should store user access token if present', async () => {
      mockTokenRepository.findOne.mockResolvedValue(null);

      const tokenData = {
        access_token: 'xoxb-bot-token',
        token_type: 'bot',
        scope: 'channels:read',
        ok: true,
        authed_user: {
          id: 'U123',
          access_token: 'xoxp-user-token',
          token_type: 'user',
          scope: 'chat:write',
        },
      };

      await slackOAuth.storeUserToken(1, tokenData);

      expect(mockTokenRepository.create).toHaveBeenCalledTimes(2);
      expect(mockTokenRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 1,
          token_type: 'slack_user_access_token',
        })
      );
    });

    it('should update existing user access token', async () => {
      const existingUserToken = {
        user_id: 1,
        token_type: 'slack_user_access_token',
        token_value: 'old_token',
        scopes: [],
      };

      mockTokenRepository.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(existingUserToken);

      const tokenData = {
        access_token: 'xoxb-bot-token',
        token_type: 'bot',
        scope: 'channels:read',
        ok: true,
        authed_user: {
          id: 'U123',
          access_token: 'xoxp-new-user-token',
          token_type: 'user',
          scope: 'chat:write',
        },
      };

      await slackOAuth.storeUserToken(1, tokenData);

      expect(mockTokenRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          token_type: 'slack_user_access_token',
        })
      );
    });
  });

  describe('getUserToken', () => {
    it('should retrieve and decrypt user token', async () => {
      const encryptedToken = Buffer.from('xoxb-token:::1').toString('base64');
      const mockToken = {
        user_id: 1,
        token_type: 'slack_access_token',
        token_value: encryptedToken,
        is_revoked: false,
      };

      mockTokenRepository.findOne.mockResolvedValue(mockToken);

      const result = await slackOAuth.getUserToken(1);

      expect(mockTokenRepository.findOne).toHaveBeenCalledWith({
        where: {
          user_id: 1,
          token_type: 'slack_access_token',
          is_revoked: false,
        },
      });
      expect(result?.token_value).toBe('xoxb-token');
    });

    it('should return null when no token found', async () => {
      mockTokenRepository.findOne.mockResolvedValue(null);

      const result = await slackOAuth.getUserToken(1);

      expect(result).toBeNull();
    });
  });

  describe('getUserAccessToken', () => {
    it('should retrieve user access token', async () => {
      const encryptedToken = Buffer.from('xoxp-user-token:::2').toString(
        'base64'
      );
      const mockToken = {
        user_id: 2,
        token_type: 'slack_user_access_token',
        token_value: encryptedToken,
        is_revoked: false,
      };

      mockTokenRepository.findOne.mockResolvedValue(mockToken);

      const result = await slackOAuth.getUserAccessToken(2);

      expect(result?.token_value).toBe('xoxp-user-token');
    });

    it('should return null when no user access token found', async () => {
      mockTokenRepository.findOne.mockResolvedValue(null);

      const result = await slackOAuth.getUserAccessToken(1);

      expect(result).toBeNull();
    });
  });

  describe('revokeUserToken', () => {
    it('should revoke all user tokens', async () => {
      const mockTokens = [
        {
          user_id: 1,
          token_type: 'slack_access_token_user_1',
          token_value: 'token1',
          is_revoked: false,
          revoked_at: undefined as Date | undefined,
          revoked_reason: undefined as string | undefined,
        },
        {
          user_id: 1,
          token_type: 'slack_user_access_token_user_1',
          token_value: 'token2',
          is_revoked: false,
          revoked_at: undefined as Date | undefined,
          revoked_reason: undefined as string | undefined,
        },
      ];

      mockTokenRepository.find.mockResolvedValue(mockTokens);

      await slackOAuth.revokeUserToken(1);

      expect(mockTokenRepository.find).toHaveBeenCalledWith({
        where: [
          {
            user_id: 1,
            token_type: 'slack_access_token_user_1',
          },
          {
            user_id: 1,
            token_type: 'slack_user_access_token_user_1',
          },
        ],
      });
      expect(mockTokenRepository.save).toHaveBeenCalledTimes(2);
      mockTokens.forEach(token => {
        expect(token.is_revoked).toBe(true);
        expect(token.revoked_at).toBeDefined();
        expect(token.revoked_reason).toBe('User requested revocation');
      });
    });

    it('should handle when no tokens found to revoke', async () => {
      mockTokenRepository.find.mockResolvedValue([]);

      await slackOAuth.revokeUserToken(1);

      expect(mockTokenRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('createIncomingWebhook', () => {
    it('should return success for valid channel', async () => {
      const result = await slackOAuth.createIncomingWebhook(
        'xoxb-token',
        'C123'
      );

      expect(result).toEqual({
        ok: true,
        channel: 'C123',
      });
    });
  });

  describe('refreshAccessToken', () => {
    it('should throw error as Slack tokens do not require refresh', async () => {
      await expect(slackOAuth.refreshAccessToken()).rejects.toThrow(
        'Slack tokens do not require refresh in the same way'
      );
    });
  });
});
