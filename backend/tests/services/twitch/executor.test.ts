import type { ReactionExecutionContext } from '../../../src/types/service';

// Mock node-fetch before importing oauth.ts to avoid ESM issues
const mockFetch = jest.fn() as jest.MockedFunction<typeof fetch>;
jest.mock('node-fetch', () => mockFetch);
global.fetch = mockFetch;

// Set environment variables before importing to avoid instantiation error
process.env.SERVICE_TWITCH_CLIENT_ID = 'test-client-id';
process.env.SERVICE_TWITCH_CLIENT_SECRET = 'test-client-secret';
process.env.SERVICE_TWITCH_REDIRECT_URI = 'https://test.com/callback';
process.env.SERVICE_TWITCH_API_BASE_URL = 'https://api.twitch.tv/helix';
process.env.SERVICE_TWITCH_AUTH_BASE_URL = 'https://id.twitch.tv/oauth2';

jest.mock('../../../src/services/services/twitch/oauth');

import { TwitchReactionExecutor } from '../../../src/services/services/twitch/executor';
import { twitchOAuth } from '../../../src/services/services/twitch/oauth';

describe('TwitchReactionExecutor', () => {
  let executor: TwitchReactionExecutor;

  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = {
      ...originalEnv,
      SERVICE_TWITCH_API_BASE_URL: 'https://api.twitch.tv/helix',
      SERVICE_TWITCH_CLIENT_ID: 'test-client-id',
    };

    executor = new TwitchReactionExecutor();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  const createMockContext = (
    reactionType: string,
    config: Record<string, unknown>
  ): ReactionExecutionContext => ({
    reaction: {
      id: 1,
      type: reactionType,
      config,
      user_id: 1,
      webhook_config_id: 1,
    } as any,
    event: {
      id: 1,
      action_type: 'test.action',
      user_id: 1,
      payload: {},
      created_at: new Date(),
    },
    mapping: {
      id: 1,
      name: 'Test Mapping',
      created_by: 1,
    },
    serviceConfig: {},
  });

  describe('execute', () => {
    it('should return error when user token not found', async () => {
      (twitchOAuth.getUserToken as jest.Mock).mockResolvedValue(null);

      const context = createMockContext('twitch.update_channel', {
        description: 'Test',
      });

      const result = await executor.execute(context);

      expect(result.success).toBe(false);
      expect(result.error).toContain('access token not found');
    });

    it('should return error for unknown reaction type', async () => {
      (twitchOAuth.getUserToken as jest.Mock).mockResolvedValue({
        token_value: 'test-token',
      });

      const context = createMockContext('twitch.unknown_reaction', {});

      const result = await executor.execute(context);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unknown reaction type');
    });

    it('should handle execution errors', async () => {
      (twitchOAuth.getUserToken as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      const context = createMockContext('twitch.update_channel', {
        description: 'Test',
      });

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await executor.execute(context);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Database error');

      consoleErrorSpy.mockRestore();
    });
  });

  describe('updateChannel', () => {
    beforeEach(() => {
      (twitchOAuth.getUserToken as jest.Mock).mockResolvedValue({
        token_value: 'test-token',
      });
    });

    it('should update channel description successfully', async () => {
      const mockUserId = 'user-123';
      const newDescription = 'New channel description';

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: [{ id: mockUserId }] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            data: [{ description: 'Old description' }],
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: [{ id: mockUserId }] }),
        });

      const context = createMockContext('twitch.update_channel', {
        description: newDescription,
      });

      const result = await executor.execute(context);

      expect(result.success).toBe(true);
      expect(result.output?.broadcaster_id).toBe(mockUserId);
      expect(result.output?.new_description).toBe(newDescription);
      expect(result.output?.old_description).toBe('Old description');
    });

    it('should return error when description is empty', async () => {
      const context = createMockContext('twitch.update_channel', {
        description: '',
      });

      const result = await executor.execute(context);

      expect(result.success).toBe(false);
      expect(result.error).toContain('description is required');
    });

    it('should return error when description is too long', async () => {
      const longDescription = 'a'.repeat(301);

      const context = createMockContext('twitch.update_channel', {
        description: longDescription,
      });

      const result = await executor.execute(context);

      expect(result.success).toBe(false);
      expect(result.error).toContain('cannot exceed 300 characters');
    });

    it('should return error when failed to get user ID', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
      });

      const context = createMockContext('twitch.update_channel', {
        description: 'Test description',
      });

      const result = await executor.execute(context);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to get authenticated user');
    });

    it('should handle 401 authentication error', async () => {
      const mockUserId = 'user-123';

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: [{ id: mockUserId }] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: [{ description: 'Old' }] }),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          json: async () => ({ message: 'Unauthorized' }),
        });

      const context = createMockContext('twitch.update_channel', {
        description: 'New description',
      });

      const result = await executor.execute(context);

      expect(result.success).toBe(false);
      expect(result.error).toContain('reauthorize');
    });

    it('should handle 403 permission error', async () => {
      const mockUserId = 'user-123';

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: [{ id: mockUserId }] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: [{ description: 'Old' }] }),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 403,
          json: async () => ({ message: 'Forbidden' }),
        });

      const context = createMockContext('twitch.update_channel', {
        description: 'New description',
      });

      const result = await executor.execute(context);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Insufficient permissions');
    });

    it('should handle 400 bad request error', async () => {
      const mockUserId = 'user-123';

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: [{ id: mockUserId }] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: [{ description: 'Old' }] }),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 400,
          json: async () => ({ message: 'Invalid description' }),
        });

      const context = createMockContext('twitch.update_channel', {
        description: 'New description',
      });

      const result = await executor.execute(context);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid description');
    });

    it('should handle 500 server error', async () => {
      const mockUserId = 'user-123';

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: [{ id: mockUserId }] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: [{ description: 'Old' }] }),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          json: async () => ({ message: 'Server error' }),
        });

      const context = createMockContext('twitch.update_channel', {
        description: 'New description',
      });

      const result = await executor.execute(context);

      expect(result.success).toBe(false);
      expect(result.error).toContain('server error');
    });

    it('should handle network errors', async () => {
      const mockUserId = 'user-123';

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: [{ id: mockUserId }] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: [{ description: 'Old' }] }),
        })
        .mockRejectedValueOnce(new Error('Network failure'));

      const context = createMockContext('twitch.update_channel', {
        description: 'New description',
      });

      const result = await executor.execute(context);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Network error');
    });

    it('should trim whitespace from description', async () => {
      const mockUserId = 'user-123';

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: [{ id: mockUserId }] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: [{ description: 'Old' }] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: [{ id: mockUserId }] }),
        });

      const context = createMockContext('twitch.update_channel', {
        description: '  Test description  ',
      });

      const result = await executor.execute(context);

      expect(result.success).toBe(true);
      expect(result.output?.new_description).toBe('Test description');
    });
  });

  describe('banUser', () => {
    beforeEach(() => {
      (twitchOAuth.getUserToken as jest.Mock).mockResolvedValue({
        token_value: 'test-token',
      });
    });

    it('should ban user successfully', async () => {
      const targetUserId = 'target-123';
      const broadcasterId = 'broadcaster-123';

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: [{ id: targetUserId }] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: [{ id: broadcasterId }] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: [{ user_id: targetUserId }] }),
        });

      const context = createMockContext('twitch.ban_user', {
        username: 'targetuser',
      });

      const result = await executor.execute(context);

      expect(result.success).toBe(true);
      expect(result.output?.username).toBe('targetuser');
      expect(result.output?.broadcaster_id).toBe(broadcasterId);
    });

    it('should ban user with duration', async () => {
      const targetUserId = 'target-123';
      const broadcasterId = 'broadcaster-123';

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: [{ id: targetUserId }] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: [{ id: broadcasterId }] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: [{ user_id: targetUserId }] }),
        });

      const context = createMockContext('twitch.ban_user', {
        username: 'targetuser',
        duration: 600,
        reason: 'Spam',
      });

      const result = await executor.execute(context);

      expect(result.success).toBe(true);
      expect(result.output?.duration).toBe(600);
    });

    it('should return error when username is empty', async () => {
      const context = createMockContext('twitch.ban_user', {
        username: '',
      });

      const result = await executor.execute(context);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Username is required');
    });

    it('should return error for invalid duration (too short)', async () => {
      const context = createMockContext('twitch.ban_user', {
        username: 'testuser',
        duration: 0,
      });

      const result = await executor.execute(context);

      expect(result.success).toBe(false);
      expect(result.error).toContain('duration must be between');
    });

    it('should return error for invalid duration (too long)', async () => {
      const context = createMockContext('twitch.ban_user', {
        username: 'testuser',
        duration: 1209601,
      });

      const result = await executor.execute(context);

      expect(result.success).toBe(false);
      expect(result.error).toContain('duration must be between');
    });

    it('should return error when reason is too long', async () => {
      const context = createMockContext('twitch.ban_user', {
        username: 'testuser',
        reason: 'a'.repeat(501),
      });

      const result = await executor.execute(context);

      expect(result.success).toBe(false);
      expect(result.error).toContain('reason cannot exceed 500 characters');
    });

    it('should return error when target user not found', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      const context = createMockContext('twitch.ban_user', {
        username: 'nonexistent',
      });

      const result = await executor.execute(context);

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });

    it('should handle 409 conflict (already banned)', async () => {
      const targetUserId = 'target-123';
      const broadcasterId = 'broadcaster-123';

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: [{ id: targetUserId }] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: [{ id: broadcasterId }] }),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 409,
          json: async () => ({ message: 'Conflict' }),
        });

      const context = createMockContext('twitch.ban_user', {
        username: 'targetuser',
      });

      const result = await executor.execute(context);

      expect(result.success).toBe(false);
      expect(result.error).toContain('already banned');
    });

    it('should trim username whitespace', async () => {
      const targetUserId = 'target-123';
      const broadcasterId = 'broadcaster-123';

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: [{ id: targetUserId }] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: [{ id: broadcasterId }] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: [{ user_id: targetUserId }] }),
        });

      const context = createMockContext('twitch.ban_user', {
        username: '  targetuser  ',
      });

      const result = await executor.execute(context);

      expect(result.success).toBe(true);
      expect(result.output?.username).toBe('targetuser');
    });
  });

  describe('unbanUser', () => {
    beforeEach(() => {
      (twitchOAuth.getUserToken as jest.Mock).mockResolvedValue({
        token_value: 'test-token',
      });
    });

    it('should unban user successfully', async () => {
      const targetUserId = 'target-123';
      const broadcasterId = 'broadcaster-123';

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: [{ id: targetUserId }] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: [{ id: broadcasterId }] }),
        })
        .mockResolvedValueOnce({
          ok: true,
        });

      const context = createMockContext('twitch.unban_user', {
        username: 'targetuser',
      });

      const result = await executor.execute(context);

      expect(result.success).toBe(true);
      expect(result.output?.username).toBe('targetuser');
      expect(result.output?.broadcaster_id).toBe(broadcasterId);
    });

    it('should return error when username is empty', async () => {
      const context = createMockContext('twitch.unban_user', {
        username: '',
      });

      const result = await executor.execute(context);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Username is required');
    });

    it('should return error when target user not found', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      const context = createMockContext('twitch.unban_user', {
        username: 'nonexistent',
      });

      const result = await executor.execute(context);

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });

    it('should handle 404 not banned error', async () => {
      const targetUserId = 'target-123';
      const broadcasterId = 'broadcaster-123';

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: [{ id: targetUserId }] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: [{ id: broadcasterId }] }),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 404,
          json: async () => ({ message: 'Not Found' }),
        });

      const context = createMockContext('twitch.unban_user', {
        username: 'targetuser',
      });

      const result = await executor.execute(context);

      expect(result.success).toBe(false);
      expect(result.error).toContain('not currently banned');
    });

    it('should handle 401 authentication error', async () => {
      const targetUserId = 'target-123';
      const broadcasterId = 'broadcaster-123';

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: [{ id: targetUserId }] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: [{ id: broadcasterId }] }),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          json: async () => ({ message: 'Unauthorized' }),
        });

      const context = createMockContext('twitch.unban_user', {
        username: 'targetuser',
      });

      const result = await executor.execute(context);

      expect(result.success).toBe(false);
      expect(result.error).toContain('reauthorize');
    });

    it('should handle 403 permission error', async () => {
      const targetUserId = 'target-123';
      const broadcasterId = 'broadcaster-123';

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: [{ id: targetUserId }] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: [{ id: broadcasterId }] }),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 403,
          json: async () => ({ message: 'Forbidden' }),
        });

      const context = createMockContext('twitch.unban_user', {
        username: 'targetuser',
      });

      const result = await executor.execute(context);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Insufficient permissions');
    });

    it('should handle 400 bad request error', async () => {
      const targetUserId = 'target-123';
      const broadcasterId = 'broadcaster-123';

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: [{ id: targetUserId }] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: [{ id: broadcasterId }] }),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 400,
          json: async () => ({ message: 'Bad Request' }),
        });

      const context = createMockContext('twitch.unban_user', {
        username: 'targetuser',
      });

      const result = await executor.execute(context);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid request');
    });

    it('should handle network errors', async () => {
      const targetUserId = 'target-123';
      const broadcasterId = 'broadcaster-123';

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: [{ id: targetUserId }] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: [{ id: broadcasterId }] }),
        })
        .mockRejectedValueOnce(new Error('Network failure'));

      const context = createMockContext('twitch.unban_user', {
        username: 'targetuser',
      });

      const result = await executor.execute(context);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Network error');
    });

    it('should trim username whitespace', async () => {
      const targetUserId = 'target-123';
      const broadcasterId = 'broadcaster-123';

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: [{ id: targetUserId }] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: [{ id: broadcasterId }] }),
        })
        .mockResolvedValueOnce({
          ok: true,
        });

      const context = createMockContext('twitch.unban_user', {
        username: '  targetuser  ',
      });

      const result = await executor.execute(context);

      expect(result.success).toBe(true);
      expect(result.output?.username).toBe('targetuser');
    });
  });
});
