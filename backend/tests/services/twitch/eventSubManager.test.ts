import { TwitchEventSubManager } from '../../../src/services/services/twitch/eventSubManager';
import { AppDataSource } from '../../../src/config/db';
import { ExternalWebhooks } from '../../../src/config/entity/ExternalWebhooks';

jest.mock('../../../src/config/db');

global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;

describe('TwitchEventSubManager', () => {
  let manager: TwitchEventSubManager;
  let mockWebhookRepo: any;

  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = {
      ...originalEnv,
      SERVICE_TWITCH_CLIENT_ID: 'test-client-id',
      SERVICE_TWITCH_CLIENT_SECRET: 'test-client-secret',
      WEBHOOK_BASE_URL: 'https://test.webhook.com',
      SERVICE_TWITCH_API_BASE_URL: 'https://api.twitch.tv',
      SERVICE_TWITCH_AUTH_BASE_URL: 'https://id.twitch.tv',
    };

    manager = new TwitchEventSubManager();

    mockWebhookRepo = {
      save: jest.fn(),
    };

    (AppDataSource.getRepository as jest.Mock).mockReturnValue(mockWebhookRepo);
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('getAppAccessToken', () => {
    it('should get app access token successfully', async () => {
      const mockToken = 'test-app-access-token';
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: mockToken }),
      });

      const result = await (manager as any).getAppAccessToken();

      expect(result).toBe(mockToken);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://id.twitch.tv/token',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        })
      );
    });

    it('should throw error when token request fails', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
      });

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      await expect((manager as any).getAppAccessToken()).rejects.toThrow(
        'Failed to authenticate with Twitch'
      );

      consoleErrorSpy.mockRestore();
    });

    it('should handle network errors', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Network error')
      );

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      await expect((manager as any).getAppAccessToken()).rejects.toThrow(
        'Failed to authenticate with Twitch'
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('createSubscription', () => {
    it('should create subscription successfully', async () => {
      const mockToken = 'test-token';
      const mockSubscription = {
        id: 'sub-123',
        status: 'enabled',
        type: 'channel.follow',
        version: '2',
        condition: { broadcaster_user_id: 'broadcaster-123' },
        created_at: '2024-01-01T00:00:00Z',
        cost: 1,
      };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: mockToken }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: [mockSubscription] }),
        });

      const result = await manager.createSubscription(
        1,
        'broadcaster-123',
        'channel.follow',
        'moderator-123'
      );

      expect(result.id).toBe('sub-123');
      expect(result.status).toBe('enabled');
      expect(result.type).toBe('channel.follow');
      expect(result.transport.method).toBe('webhook');
      expect(result.transport.callback).toContain('webhooks/twitch');
    });

    it('should throw error when moderatorId is missing for required events', async () => {
      const mockToken = 'test-token';

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: mockToken }),
      });

      await expect(
        manager.createSubscription(1, 'broadcaster-123', 'channel.follow')
      ).rejects.toThrow('moderatorId is required for channel.follow');
    });

    it('should handle duplicate subscription (409 conflict)', async () => {
      const mockToken = 'test-token';
      const existingSubscription = {
        id: 'existing-sub',
        status: 'webhook_callback_verification_pending',
        type: 'channel.follow',
        version: '2',
        condition: { broadcaster_user_id: 'broadcaster-123' },
        created_at: '2024-01-01T00:00:00Z',
        cost: 1,
      };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: mockToken }),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 409,
          json: async () => ({ error: 'Conflict' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: mockToken }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: [existingSubscription] }),
        });

      const result = await manager.createSubscription(
        1,
        'broadcaster-123',
        'channel.follow',
        'moderator-123'
      );

      expect(result.id).toBe('existing-sub');
      expect(result.status).toBe('webhook_callback_verification_pending');
    });

    it('should delete and recreate subscription if webhook failed', async () => {
      const mockToken = 'test-token';
      const failedSubscription = {
        id: 'failed-sub',
        status: 'webhook_callback_verification_failed',
        type: 'channel.follow',
        version: '2',
        condition: { broadcaster_user_id: 'broadcaster-123' },
        created_at: '2024-01-01T00:00:00Z',
        cost: 1,
      };

      const newSubscription = {
        id: 'new-sub',
        status: 'enabled',
        type: 'channel.follow',
        version: '2',
        condition: { broadcaster_user_id: 'broadcaster-123' },
        created_at: '2024-01-02T00:00:00Z',
        cost: 1,
      };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: mockToken }),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 409,
          json: async () => ({ error: 'Conflict' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: mockToken }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: [failedSubscription] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: mockToken }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({}),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: mockToken }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: [newSubscription] }),
        });

      const result = await manager.createSubscription(
        1,
        'broadcaster-123',
        'channel.follow',
        'moderator-123'
      );

      expect(result.id).toBe('new-sub');
    });

    it('should handle API errors', async () => {
      const mockToken = 'test-token';

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: mockToken }),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 400,
          statusText: 'Bad Request',
          json: async () => ({
            error: 'Bad Request',
            message: 'Invalid params',
          }),
        });

      await expect(
        manager.createSubscription(
          1,
          'broadcaster-123',
          'channel.follow',
          'moderator-123'
        )
      ).rejects.toThrow();
    });

    it('should handle invalid API response', async () => {
      const mockToken = 'test-token';

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: mockToken }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: [] }),
        });

      await expect(
        manager.createSubscription(
          1,
          'broadcaster-123',
          'channel.follow',
          'moderator-123'
        )
      ).rejects.toThrow('Invalid response from Twitch API');
    });
  });

  describe('createSubscriptionForAction', () => {
    it('should create subscription for new_follower action', async () => {
      const mockToken = 'test-token';
      const mockSubscription = {
        id: 'sub-123',
        status: 'enabled',
        type: 'channel.follow',
        version: '2',
        condition: { broadcaster_user_id: 'broadcaster-123' },
        created_at: '2024-01-01T00:00:00Z',
        cost: 1,
      };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: mockToken }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: [mockSubscription] }),
        });

      await manager.createSubscriptionForAction(
        1,
        'twitch.new_follower',
        'broadcaster-123',
        'moderator-123'
      );

      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('should create subscription for new_subscription action', async () => {
      const mockToken = 'test-token';
      const mockSubscription = {
        id: 'sub-456',
        status: 'enabled',
        type: 'channel.subscribe',
        version: '1',
        condition: { broadcaster_user_id: 'broadcaster-123' },
        created_at: '2024-01-01T00:00:00Z',
        cost: 1,
      };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: mockToken }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: [mockSubscription] }),
        });

      await manager.createSubscriptionForAction(
        1,
        'twitch.new_subscription',
        'broadcaster-123',
        'moderator-123'
      );

      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('should throw error for unknown action type', async () => {
      await expect(
        manager.createSubscriptionForAction(
          1,
          'twitch.unknown_action',
          'broadcaster-123'
        )
      ).rejects.toThrow('Unknown action type: twitch.unknown_action');
    });
  });

  describe('createWebhook', () => {
    it('should create webhook successfully', async () => {
      const mockToken = 'test-token';
      const mockSubscription = {
        id: 'sub-123',
        status: 'enabled',
        type: 'channel.follow',
        version: '2',
        condition: { broadcaster_user_id: 'broadcaster-123' },
        transport: {
          method: 'webhook',
          callback: 'https://test.webhook.com/api/webhooks/twitch',
          secret: 'test-secret',
        },
        created_at: '2024-01-01T00:00:00Z',
        cost: 1,
      };

      const savedWebhook = {
        id: 999,
        user_id: 1,
        service: 'twitch',
        external_id: 'sub-123',
        url: mockSubscription.transport.callback,
        secret: mockSubscription.transport.secret,
        events: ['twitch.new_follower'],
        is_active: true,
      };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: mockToken }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: [mockSubscription] }),
        });

      mockWebhookRepo.save.mockResolvedValue(savedWebhook);

      const result = await manager.createWebhook(
        1,
        'twitch.new_follower',
        'broadcaster-123',
        'moderator-123'
      );

      expect(result).toBe(savedWebhook);
      expect(mockWebhookRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 1,
          service: 'twitch',
          external_id: 'sub-123',
          is_active: true,
        })
      );
    });

    it('should handle getSubscriptionType for unknown action', async () => {
      await expect(
        manager.createWebhook(1, 'twitch.unknown', 'broadcaster-123')
      ).rejects.toThrow('Unknown action type: twitch.unknown');
    });
  });

  describe('deleteSubscription', () => {
    it('should delete subscription successfully', async () => {
      const mockToken = 'test-token';

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: mockToken }),
        })
        .mockResolvedValueOnce({
          ok: true,
        });

      await manager.deleteSubscription('sub-123');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('eventsub/subscriptions?id=sub-123'),
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });

    it('should handle deletion errors', async () => {
      const mockToken = 'test-token';

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: mockToken }),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 404,
          statusText: 'Not Found',
        });

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      await expect(manager.deleteSubscription('sub-123')).rejects.toThrow(
        'HTTP 404: Not Found'
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('getSubscriptions', () => {
    it('should get all subscriptions successfully', async () => {
      const mockToken = 'test-token';
      const mockSubscriptions = [
        { id: 'sub-1', type: 'channel.follow', status: 'enabled' },
        { id: 'sub-2', type: 'channel.subscribe', status: 'enabled' },
      ];

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: mockToken }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockSubscriptions }),
        });

      const result = await manager.getSubscriptions();

      expect(result).toEqual(mockSubscriptions);
    });

    it('should return empty array on error', async () => {
      const mockToken = 'test-token';

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: mockToken }),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
        });

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await manager.getSubscriptions();

      expect(result).toEqual([]);
      consoleErrorSpy.mockRestore();
    });

    it('should return empty array when no data in response', async () => {
      const mockToken = 'test-token';

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: mockToken }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({}),
        });

      const result = await manager.getSubscriptions();

      expect(result).toEqual([]);
    });
  });

  describe('getUserId', () => {
    it('should get user ID by username successfully', async () => {
      const mockToken = 'test-token';
      const mockUser = { id: 'user-123', login: 'testuser' };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: mockToken }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: [mockUser] }),
        });

      const result = await manager.getUserId('testuser');

      expect(result).toBe('user-123');
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('users?login=testuser'),
        expect.any(Object)
      );
    });

    it('should return null when user not found', async () => {
      const mockToken = 'test-token';

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: mockToken }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: [] }),
        });

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await manager.getUserId('nonexistent');

      expect(result).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('User nonexistent not found')
      );

      consoleErrorSpy.mockRestore();
    });

    it('should return null on API error', async () => {
      const mockToken = 'test-token';

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: mockToken }),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 400,
          statusText: 'Bad Request',
        });

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await manager.getUserId('testuser');

      expect(result).toBeNull();
      consoleErrorSpy.mockRestore();
    });

    it('should handle network errors', async () => {
      const mockToken = 'test-token';

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: mockToken }),
        })
        .mockRejectedValueOnce(new Error('Network error'));

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await manager.getUserId('testuser');

      expect(result).toBeNull();
      consoleErrorSpy.mockRestore();
    });
  });

  describe('getUserInfo', () => {
    it('should get user info by ID successfully', async () => {
      const mockToken = 'test-token';
      const mockUser = {
        id: 'user-123',
        login: 'testuser',
        display_name: 'TestUser',
      };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: mockToken }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: [mockUser] }),
        });

      const result = await manager.getUserInfo('user-123');

      expect(result).toEqual(mockUser);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('users?id=user-123'),
        expect.any(Object)
      );
    });

    it('should return null when user not found', async () => {
      const mockToken = 'test-token';

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: mockToken }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: [] }),
        });

      const result = await manager.getUserInfo('user-123');

      expect(result).toBeNull();
    });

    it('should return null on API error', async () => {
      const mockToken = 'test-token';

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: mockToken }),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 404,
          statusText: 'Not Found',
        });

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await manager.getUserInfo('user-123');

      expect(result).toBeNull();
      consoleErrorSpy.mockRestore();
    });

    it('should handle network errors', async () => {
      const mockToken = 'test-token';

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: mockToken }),
        })
        .mockRejectedValueOnce(new Error('Network error'));

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await manager.getUserInfo('user-123');

      expect(result).toBeNull();
      consoleErrorSpy.mockRestore();
    });
  });
});
