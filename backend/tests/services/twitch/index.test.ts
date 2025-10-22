import type { Service } from '../../../src/types/service';

// Mock adminjs before any imports that depend on it
jest.mock('adminjs', () => ({
  default: jest.fn(),
  ComponentLoader: jest.fn(),
}));

// Mock adminJs.ts to avoid importing AdminJS packages
jest.mock('../../../src/config/adminJs', () => ({
  setupAdminPanel: jest.fn(),
}));

// Mock the entire index.ts to prevent server startup
jest.mock('../../../index', () => ({
  encryption: {
    encrypt: jest.fn(data => `encrypted_${data}`),
    decrypt: jest.fn(data => data.replace('encrypted_', '')),
  },
}));

// Mock passport with proper methods
jest.mock('passport', () => ({
  initialize: jest.fn(() => (req: any, res: any, next: any) => next()),
  session: jest.fn(() => (req: any, res: any, next: any) => next()),
  use: jest.fn(),
  authenticate: jest.fn(),
  serializeUser: jest.fn(),
  deserializeUser: jest.fn(),
}));

// Mock dependencies before importing
jest.mock('../../../src/services/services/twitch/oauth');
jest.mock('../../../src/services/services/twitch/eventSubManager');
jest.mock('../../../src/services/services/twitch/passport');

// Mock node-fetch to avoid ESM issues
const mockFetch = jest.fn() as jest.MockedFunction<typeof fetch>;
jest.mock('node-fetch', () => mockFetch);
global.fetch = mockFetch;

// Set environment variables before importing
process.env.SERVICE_TWITCH_CLIENT_ID = 'test-client-id';
process.env.SERVICE_TWITCH_CLIENT_SECRET = 'test-client-secret';
process.env.SERVICE_TWITCH_REDIRECT_URI = 'https://test.com/callback';
process.env.SERVICE_TWITCH_API_BASE_URL = 'https://api.twitch.tv/helix';
process.env.SERVICE_TWITCH_AUTH_BASE_URL = 'https://id.twitch.tv/oauth2';

import twitchService, {
  initialize,
  cleanup,
} from '../../../src/services/services/twitch/index';
import { twitchOAuth } from '../../../src/services/services/twitch/oauth';
import { twitchEventSubManager } from '../../../src/services/services/twitch/eventSubManager';
import { initializeTwitchPassport } from '../../../src/services/services/twitch/passport';

describe('Twitch Service Index', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Service Definition', () => {
    it('should export a valid service object', () => {
      expect(twitchService).toBeDefined();
      expect(twitchService.id).toBe('twitch');
      expect(twitchService.name).toBe('Twitch');
      expect(twitchService.version).toBe('1.0.0');
    });

    it('should have correct service metadata', () => {
      expect(twitchService.description).toContain('Twitch service');
      expect(twitchService.icon).toContain('svg');
      expect(twitchService.oauth).toEqual({
        enabled: true,
        supportsLogin: false,
      });
    });

    it('should define actions array', () => {
      expect(twitchService.actions).toBeDefined();
      expect(Array.isArray(twitchService.actions)).toBe(true);
      expect(twitchService.actions.length).toBeGreaterThan(0);
    });

    it('should define reactions array', () => {
      expect(twitchService.reactions).toBeDefined();
      expect(Array.isArray(twitchService.reactions)).toBe(true);
      expect(twitchService.reactions).toHaveLength(3);
    });

    it('should have update_channel reaction with correct structure', () => {
      const reaction = twitchService.reactions?.find(
        r => r.id === 'twitch.update_channel'
      );
      expect(reaction).toBeDefined();
      expect(reaction?.name).toBe('Update Channel Description');
      expect(reaction?.metadata?.requiresAuth).toBe(true);
      expect(reaction?.metadata?.category).toBe('Content Management');
      expect(reaction?.configSchema).toBeDefined();
      expect(reaction?.outputSchema).toBeDefined();
    });

    it('should have ban_user reaction with correct structure', () => {
      const reaction = twitchService.reactions?.find(
        r => r.id === 'twitch.ban_user'
      );
      expect(reaction).toBeDefined();
      expect(reaction?.name).toBe('Ban User');
      expect(reaction?.metadata?.requiresAuth).toBe(true);
      expect(reaction?.metadata?.category).toBe('Moderation');
      expect(reaction?.configSchema).toBeDefined();
      expect(reaction?.outputSchema).toBeDefined();
    });

    it('should have unban_user reaction with correct structure', () => {
      const reaction = twitchService.reactions?.find(
        r => r.id === 'twitch.unban_user'
      );
      expect(reaction).toBeDefined();
      expect(reaction?.name).toBe('Unban User');
      expect(reaction?.metadata?.requiresAuth).toBe(true);
      expect(reaction?.metadata?.category).toBe('Moderation');
      expect(reaction?.configSchema).toBeDefined();
      expect(reaction?.outputSchema).toBeDefined();
    });
  });

  describe('getCredentials', () => {
    it('should return credentials when user token exists', async () => {
      const mockToken = {
        id: 1,
        user_id: 1,
        token_type: 'twitch_access_token',
        token_value: 'test-token',
        is_revoked: false,
      };

      (twitchOAuth.getUserToken as jest.Mock).mockResolvedValue(mockToken);

      const credentials = await twitchService.getCredentials!(1);

      expect(credentials).toEqual({ access_token: 'test-token' });
      expect(twitchOAuth.getUserToken).toHaveBeenCalledWith(1);
    });

    it('should return empty object when no user token found', async () => {
      (twitchOAuth.getUserToken as jest.Mock).mockResolvedValue(null);

      const credentials = await twitchService.getCredentials!(1);

      expect(credentials).toEqual({});
      expect(twitchOAuth.getUserToken).toHaveBeenCalledWith(1);
    });
  });

  describe('ensureWebhookForMapping', () => {
    const mockMapping = {
      id: 1,
      user_id: 1,
      action: {
        service_id: 'twitch',
        action_id: 'twitch.new_follower',
        config: {},
      },
      reactions: [],
    };

    const mockActionDefinition = {
      id: 'twitch.new_follower',
      name: 'New Follower',
      metadata: {
        webhookPattern: 'channel.follow',
      },
    };

    it('should skip webhook creation when no webhookPattern', async () => {
      const actionWithoutWebhook = {
        id: 'twitch.some_action',
        name: 'Some Action',
        metadata: {},
      };

      await twitchService.ensureWebhookForMapping!(
        mockMapping as any,
        1,
        actionWithoutWebhook as any
      );

      expect(twitchOAuth.getUserToken).not.toHaveBeenCalled();
    });

    it('should skip webhook creation when no user token', async () => {
      (twitchOAuth.getUserToken as jest.Mock).mockResolvedValue(null);

      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      await twitchService.ensureWebhookForMapping!(
        mockMapping as any,
        1,
        mockActionDefinition as any
      );

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Cannot create webhook: no Twitch token found for user'
      );
      expect(twitchEventSubManager.createWebhook).not.toHaveBeenCalled();

      consoleWarnSpy.mockRestore();
    });

    it('should skip webhook creation when getUserInfo fails', async () => {
      const mockToken = {
        token_value: 'test-token',
      };

      (twitchOAuth.getUserToken as jest.Mock).mockResolvedValue(mockToken);
      (twitchOAuth.getUserInfo as jest.Mock).mockResolvedValue(null);

      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      await twitchService.ensureWebhookForMapping!(
        mockMapping as any,
        1,
        mockActionDefinition as any
      );

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Cannot create webhook: failed to get user info'
      );
      expect(twitchEventSubManager.createWebhook).not.toHaveBeenCalled();

      consoleWarnSpy.mockRestore();
    });

    it('should create webhook for new_follower action', async () => {
      const mockToken = { token_value: 'test-token' };
      const mockUserInfo = { id: 'user-123', login: 'testuser' };

      (twitchOAuth.getUserToken as jest.Mock).mockResolvedValue(mockToken);
      (twitchOAuth.getUserInfo as jest.Mock).mockResolvedValue(mockUserInfo);
      (twitchEventSubManager.createWebhook as jest.Mock).mockResolvedValue({});

      await twitchService.ensureWebhookForMapping!(
        mockMapping as any,
        1,
        mockActionDefinition as any
      );

      expect(twitchEventSubManager.createWebhook).toHaveBeenCalledWith(
        1,
        'twitch.new_follower',
        'user-123',
        'user-123'
      );
    });

    it('should create webhook for new_subscription action', async () => {
      const mockToken = { token_value: 'test-token' };
      const mockUserInfo = { id: 'user-123', login: 'testuser' };
      const subscriptionMapping = {
        ...mockMapping,
        action: {
          service_id: 'twitch',
          action_id: 'twitch.new_subscription',
          config: {},
        },
      };
      const subscriptionAction = {
        id: 'twitch.new_subscription',
        name: 'New Subscription',
        metadata: {
          webhookPattern: 'channel.subscribe',
        },
      };

      (twitchOAuth.getUserToken as jest.Mock).mockResolvedValue(mockToken);
      (twitchOAuth.getUserInfo as jest.Mock).mockResolvedValue(mockUserInfo);
      (twitchEventSubManager.createWebhook as jest.Mock).mockResolvedValue({});

      await twitchService.ensureWebhookForMapping!(
        subscriptionMapping as any,
        1,
        subscriptionAction as any
      );

      expect(twitchEventSubManager.createWebhook).toHaveBeenCalledWith(
        1,
        'twitch.new_subscription',
        'user-123',
        'user-123'
      );
    });

    it('should handle webhook creation errors gracefully', async () => {
      const mockToken = { token_value: 'test-token' };
      const mockUserInfo = { id: 'user-123', login: 'testuser' };

      (twitchOAuth.getUserToken as jest.Mock).mockResolvedValue(mockToken);
      (twitchOAuth.getUserInfo as jest.Mock).mockResolvedValue(mockUserInfo);
      (twitchEventSubManager.createWebhook as jest.Mock).mockRejectedValue(
        new Error('Failed to create webhook')
      );

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      await twitchService.ensureWebhookForMapping!(
        mockMapping as any,
        1,
        mockActionDefinition as any
      );

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '❌ Failed to create webhook for mapping:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });

    it('should skip webhook for unsupported action type', async () => {
      const mockToken = { token_value: 'test-token' };
      const mockUserInfo = { id: 'user-123', login: 'testuser' };
      const mappingWithUnsupported = {
        ...mockMapping,
        action: {
          service_id: 'twitch',
          action_id: 'twitch.unsupported_action',
          config: { broadcaster_username: 'broadcaster' },
        },
      };
      const unsupportedAction = {
        id: 'twitch.unsupported_action',
        name: 'Unsupported',
        metadata: {
          webhookPattern: 'some.pattern',
        },
      };

      (twitchOAuth.getUserToken as jest.Mock).mockResolvedValue(mockToken);
      (twitchOAuth.getUserInfo as jest.Mock).mockResolvedValue(mockUserInfo);
      (twitchEventSubManager.getUserId as jest.Mock).mockResolvedValue(
        'broadcaster-123'
      );

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      await twitchService.ensureWebhookForMapping!(
        mappingWithUnsupported as any,
        1,
        unsupportedAction as any
      );

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '❌ Unsupported action type: twitch.unsupported_action'
      );
      expect(twitchEventSubManager.createWebhook).not.toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });

  describe('initialize', () => {
    it('should call initializeTwitchPassport', async () => {
      await initialize();

      expect(initializeTwitchPassport).toHaveBeenCalled();
    });
  });

  describe('cleanup', () => {
    it('should resolve without errors', async () => {
      await expect(cleanup()).resolves.toBeUndefined();
    });
  });
});
