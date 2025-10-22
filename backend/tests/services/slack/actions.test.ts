import { slackActions } from '../../../src/services/services/slack/actions';
import { AppDataSource } from '../../../src/config/db';
import { UserToken } from '../../../src/config/entity/UserToken';

jest.mock('../../../src/config/db');
jest.mock('../../../src/services/services/slack/executor', () => ({
  slackReactionExecutor: {
    resolveChannelId: jest.fn(),
  },
}));

describe('Slack Actions', () => {
  let mockTokenRepository: {
    findOne: jest.Mock;
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockTokenRepository = {
      findOne: jest.fn(),
    };

    (AppDataSource.getRepository as jest.Mock).mockReturnValue(
      mockTokenRepository
    );
  });

  describe('new_message action', () => {
    const newMessage = slackActions.find(a => a.id === 'slack.new_message');

    it('should exist', () => {
      expect(newMessage).toBeDefined();
    });

    it('should have correct id', () => {
      expect(newMessage?.id).toBe('slack.new_message');
    });

    it('should have correct name', () => {
      expect(newMessage?.name).toBe('New Message in Channel');
    });

    it('should have correct description', () => {
      expect(newMessage?.description).toBe(
        'Triggers when a new message is posted in a specific channel'
      );
    });

    it('should have configSchema', () => {
      expect(newMessage?.configSchema).toBeDefined();
      expect(newMessage?.configSchema.name).toBe('New Message in Channel');
    });

    it('should have inputSchema with required fields', () => {
      expect(newMessage?.inputSchema.type).toBe('object');
      expect(newMessage?.inputSchema.required).toContain('type');
      expect(newMessage?.inputSchema.required).toContain('channel');
      expect(newMessage?.inputSchema.required).toContain('user');
      expect(newMessage?.inputSchema.required).toContain('text');
      expect(newMessage?.inputSchema.required).toContain('ts');
    });

    it('should have metadata with Slack category', () => {
      expect(newMessage?.metadata.category).toBe('Slack');
      expect(newMessage?.metadata.tags).toContain('message');
      expect(newMessage?.metadata.requiresAuth).toBe(true);
    });

    it('should have webhookPattern', () => {
      expect(newMessage?.metadata.webhookPattern).toBe('message.channels');
    });

    it('should have sharedEvents enabled', () => {
      expect(newMessage?.metadata.sharedEvents).toBe(true);
      expect(newMessage?.metadata.sharedEventFilter).toBeDefined();
    });

    it('should filter events by channel when mapping has no channel config', async () => {
      const event = {
        source: 'slack',
        payload: { channel: 'C123', channel_type: 'channel' },
      };
      const mapping = {
        action: { config: {} },
      };

      const result = await newMessage?.metadata.sharedEventFilter?.(
        event,
        mapping as any,
        1
      );
      expect(result).toBe(true);
    });

    it('should filter events by channel when channel matches', async () => {
      const { slackReactionExecutor } = await import(
        '../../../src/services/services/slack/executor'
      );
      (slackReactionExecutor.resolveChannelId as jest.Mock).mockResolvedValue(
        'C123'
      );

      mockTokenRepository.findOne.mockResolvedValue({
        user_id: 1,
        token_type: 'slack_access_token',
        token_value: Buffer.from('token:::1').toString('base64'),
        is_revoked: false,
      });

      const event = {
        source: 'slack',
        payload: { channel: 'C123', channel_type: 'channel' },
      };
      const mapping = {
        action: { config: { channel: '#general' } },
      };

      const result = await newMessage?.metadata.sharedEventFilter?.(
        event,
        mapping as any,
        1
      );
      expect(result).toBe(true);
    });

    it('should reject events when channel does not match', async () => {
      const { slackReactionExecutor } = await import(
        '../../../src/services/services/slack/executor'
      );
      (slackReactionExecutor.resolveChannelId as jest.Mock).mockResolvedValue(
        'C456'
      );

      mockTokenRepository.findOne.mockResolvedValue({
        user_id: 1,
        token_type: 'slack_access_token',
        token_value: Buffer.from('token:::1').toString('base64'),
        is_revoked: false,
      });

      const event = {
        source: 'slack',
        payload: { channel: 'C123', channel_type: 'channel' },
      };
      const mapping = {
        action: { config: { channel: '#general' } },
      };

      const result = await newMessage?.metadata.sharedEventFilter?.(
        event,
        mapping as any,
        1
      );
      expect(result).toBe(false);
    });

    it('should handle missing channel in event', async () => {
      const event = {
        source: 'slack',
        payload: { channel_type: 'channel' },
      };
      const mapping = {
        action: { config: {} },
      };

      const result = await newMessage?.metadata.sharedEventFilter?.(
        event,
        mapping as any,
        1
      );
      expect(result).toBe(false);
    });
  });

  describe('new_dm action', () => {
    const newDM = slackActions.find(a => a.id === 'slack.new_dm');

    it('should exist', () => {
      expect(newDM).toBeDefined();
    });

    it('should have correct id', () => {
      expect(newDM?.id).toBe('slack.new_dm');
    });

    it('should have correct name', () => {
      expect(newDM?.name).toBe('New Direct Message');
    });

    it('should have webhookPattern for DM', () => {
      expect(newDM?.metadata.webhookPattern).toBe('message.im');
    });

    it('should not have sharedEvents enabled', () => {
      expect(newDM?.metadata.sharedEvents).toBe(false);
    });

    it('should have inputSchema with channel_type property', () => {
      expect(newDM?.inputSchema.properties?.channel_type).toBeDefined();
    });
  });

  describe('channel_created action', () => {
    const channelCreated = slackActions.find(
      a => a.id === 'slack.channel_created'
    );

    it('should exist', () => {
      expect(channelCreated).toBeDefined();
    });

    it('should have correct id', () => {
      expect(channelCreated?.id).toBe('slack.channel_created');
    });

    it('should have correct name', () => {
      expect(channelCreated?.name).toBe('Channel Created');
    });

    it('should have webhookPattern', () => {
      expect(channelCreated?.metadata.webhookPattern).toBe('channel_created');
    });

    it('should have sharedEvents enabled', () => {
      expect(channelCreated?.metadata.sharedEvents).toBe(true);
      expect(channelCreated?.metadata.sharedEventFilter).toBeDefined();
    });

    it('should have inputSchema with channel object', () => {
      expect(channelCreated?.inputSchema.properties?.channel).toBeDefined();
      expect(
        channelCreated?.inputSchema.properties?.channel?.properties?.id
      ).toBeDefined();
      expect(
        channelCreated?.inputSchema.properties?.channel?.properties?.creator
      ).toBeDefined();
    });

    it('should filter events when no creator config', () => {
      const event = {
        source: 'slack',
        payload: { channel: { creator: 'U123' } },
      };
      const mapping = {
        action: { config: {} },
      };

      const result = channelCreated?.metadata.sharedEventFilter?.(
        event,
        mapping as any
      );
      expect(result).toBe(true);
    });

    it('should filter events when creator matches', () => {
      const event = {
        source: 'slack',
        payload: { channel: { creator: 'U123' } },
      };
      const mapping = {
        action: { config: { channel: 'U123' } },
      };

      const result = channelCreated?.metadata.sharedEventFilter?.(
        event,
        mapping as any
      );
      expect(result).toBe(true);
    });

    it('should reject events when creator does not match', () => {
      const event = {
        source: 'slack',
        payload: { channel: { creator: 'U456' } },
      };
      const mapping = {
        action: { config: { channel: 'U123' } },
      };

      const result = channelCreated?.metadata.sharedEventFilter?.(
        event,
        mapping as any
      );
      expect(result).toBe(false);
    });
  });

  describe('reaction_added action', () => {
    const reactionAdded = slackActions.find(
      a => a.id === 'slack.reaction_added'
    );

    it('should exist', () => {
      expect(reactionAdded).toBeDefined();
    });

    it('should have correct id', () => {
      expect(reactionAdded?.id).toBe('slack.reaction_added');
    });

    it('should have correct name', () => {
      expect(reactionAdded?.name).toBe('Reaction Added to Message');
    });

    it('should have webhookPattern', () => {
      expect(reactionAdded?.metadata.webhookPattern).toBe('reaction_added');
    });

    it('should have sharedEvents enabled', () => {
      expect(reactionAdded?.metadata.sharedEvents).toBe(true);
      expect(reactionAdded?.metadata.sharedEventFilter).toBeDefined();
    });

    it('should have inputSchema with item and reaction', () => {
      expect(reactionAdded?.inputSchema.properties?.item).toBeDefined();
      expect(reactionAdded?.inputSchema.properties?.reaction).toBeDefined();
    });

    it('should filter events when no config', async () => {
      const event = {
        source: 'slack',
        payload: { item: { channel: 'C123' }, reaction: 'thumbsup' },
      };
      const mapping = {
        action: { config: {} },
      };

      const result = await reactionAdded?.metadata.sharedEventFilter?.(
        event,
        mapping as any,
        1
      );
      expect(result).toBe(true);
    });

    it('should filter events when channel matches', async () => {
      const { slackReactionExecutor } = await import(
        '../../../src/services/services/slack/executor'
      );
      (slackReactionExecutor.resolveChannelId as jest.Mock).mockResolvedValue(
        'C123'
      );

      mockTokenRepository.findOne.mockResolvedValue({
        user_id: 1,
        token_type: 'slack_access_token',
        token_value: Buffer.from('token:::1').toString('base64'),
        is_revoked: false,
      });

      const event = {
        source: 'slack',
        payload: { item: { channel: 'C123' }, reaction: 'thumbsup' },
      };
      const mapping = {
        action: { config: { channel: '#general' } },
      };

      const result = await reactionAdded?.metadata.sharedEventFilter?.(
        event,
        mapping as any,
        1
      );
      expect(result).toBe(true);
    });

    it('should reject events when channel does not match', async () => {
      const { slackReactionExecutor } = await import(
        '../../../src/services/services/slack/executor'
      );
      (slackReactionExecutor.resolveChannelId as jest.Mock).mockResolvedValue(
        'C456'
      );

      mockTokenRepository.findOne.mockResolvedValue({
        user_id: 1,
        token_type: 'slack_access_token',
        token_value: Buffer.from('token:::1').toString('base64'),
        is_revoked: false,
      });

      const event = {
        source: 'slack',
        payload: { item: { channel: 'C123' }, reaction: 'thumbsup' },
      };
      const mapping = {
        action: { config: { channel: '#general' } },
      };

      const result = await reactionAdded?.metadata.sharedEventFilter?.(
        event,
        mapping as any,
        1
      );
      expect(result).toBe(false);
    });

    it('should filter events by emoji when specified', async () => {
      const event = {
        source: 'slack',
        payload: { item: { channel: 'C123' }, reaction: 'thumbsup' },
      };
      const mapping = {
        action: { config: { emoji: 'thumbsup' } },
      };

      const result = await reactionAdded?.metadata.sharedEventFilter?.(
        event,
        mapping as any,
        1
      );
      expect(result).toBe(true);
    });

    it('should handle emoji with colons', async () => {
      const event = {
        source: 'slack',
        payload: { item: { channel: 'C123' }, reaction: 'thumbsup' },
      };
      const mapping = {
        action: { config: { emoji: ':thumbsup:' } },
      };

      const result = await reactionAdded?.metadata.sharedEventFilter?.(
        event,
        mapping as any,
        1
      );
      expect(result).toBe(true);
    });

    it('should reject events when emoji does not match', async () => {
      const event = {
        source: 'slack',
        payload: { item: { channel: 'C123' }, reaction: 'heart' },
      };
      const mapping = {
        action: { config: { emoji: 'thumbsup' } },
      };

      const result = await reactionAdded?.metadata.sharedEventFilter?.(
        event,
        mapping as any,
        1
      );
      expect(result).toBe(false);
    });

    it('should handle missing channel in item', async () => {
      const event = {
        source: 'slack',
        payload: { item: {}, reaction: 'thumbsup' },
      };
      const mapping = {
        action: { config: { channel: '#general' } },
      };

      const result = await reactionAdded?.metadata.sharedEventFilter?.(
        event,
        mapping as any,
        1
      );
      expect(result).toBe(false);
    });
  });

  describe('All actions', () => {
    it('should have exactly 4 actions', () => {
      expect(slackActions).toHaveLength(4);
    });

    it('should all require authentication', () => {
      slackActions.forEach(action => {
        expect(action.metadata.requiresAuth).toBe(true);
      });
    });

    it('should all have Slack category', () => {
      slackActions.forEach(action => {
        expect(action.metadata.category).toBe('Slack');
      });
    });

    it('should all have inputSchema', () => {
      slackActions.forEach(action => {
        expect(action.inputSchema).toBeDefined();
        expect(action.inputSchema.type).toBe('object');
      });
    });

    it('should all have webhookPattern', () => {
      slackActions.forEach(action => {
        expect(action.metadata.webhookPattern).toBeDefined();
      });
    });
  });
});
