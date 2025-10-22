import type { Service } from '../../../types/service';
import { twitchActions } from './actions';
import { twitchReactionExecutor } from './executor';
import {
  twitchUpdateChannelSchema,
  twitchBanUserSchema,
  twitchUnbanUserSchema,
} from './schemas';

function getSubscriptionTypeFromAction(actionType: string): string | null {
  switch (actionType) {
    case 'twitch.new_follower':
      return 'channel.follow';
    case 'twitch.new_subscription':
      return 'channel.subscribe';
    default:
      return null;
  }
}

const twitchService: Service = {
  id: 'twitch',
  name: 'Twitch',
  description:
    'Twitch service for live streaming events, subscription tracking, and channel management',
  version: '1.0.0',
  icon: `<svg stroke="currentColor" fill="#9146FF" stroke-width="0" viewBox="0 0 512 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M391.17,103.47H352.54v109.7h38.63ZM285,103H246.37V212.75H285ZM120.83,0,24.31,91.42V420.58H140.14V512l96.53-91.42h77.25L487.69,256V0ZM449.07,237.75l-77.22,73.12H294.61l-67.6,64v-64H140.14V36.58H449.07Z"></path></svg>`,
  actions: twitchActions,
  reactions: [
    {
      id: 'twitch.update_channel',
      name: 'Update Channel Description',
      description:
        "Updates the description of the authenticated user's own Twitch channel",
      configSchema: twitchUpdateChannelSchema,
      outputSchema: {
        type: 'object',
        properties: {
          broadcaster_id: {
            type: 'string',
            description: 'The ID of the channel that was updated',
          },
          old_description: {
            type: 'string',
            description: 'The previous channel description',
          },
          new_description: {
            type: 'string',
            description: 'The new channel description',
          },
          success: {
            type: 'boolean',
            description: 'Whether the update was successful',
          },
        },
        required: ['success'],
      },
      metadata: {
        category: 'Content Management',
        tags: ['twitch', 'channel', 'update', 'description', 'streaming'],
        requiresAuth: true,
        estimatedDuration: 3000,
      },
    },
    {
      id: 'twitch.ban_user',
      name: 'Ban User',
      description:
        "Bans or times out a user from the authenticated user's Twitch channel chat",
      configSchema: twitchBanUserSchema,
      outputSchema: {
        type: 'object',
        properties: {
          broadcaster_id: {
            type: 'string',
            description:
              'The ID of the channel where the user was banned/timed out',
          },
          username: {
            type: 'string',
            description: 'The username of the user who was banned/timed out',
          },
          duration: {
            type: 'number',
            description:
              'The timeout duration in seconds (null for permanent ban)',
          },
          success: {
            type: 'boolean',
            description: 'Whether the ban/timeout was successful',
          },
        },
        required: ['success'],
      },
      metadata: {
        category: 'Moderation',
        tags: ['twitch', 'moderation', 'ban', 'chat', 'user'],
        requiresAuth: true,
        estimatedDuration: 2000,
      },
    },
    {
      id: 'twitch.unban_user',
      name: 'Unban User',
      description:
        "Unbans a user from the authenticated user's Twitch channel chat",
      configSchema: twitchUnbanUserSchema,
      outputSchema: {
        type: 'object',
        properties: {
          broadcaster_id: {
            type: 'string',
            description: 'The ID of the channel where the user was unbanned',
          },
          username: {
            type: 'string',
            description: 'The username of the user who was unbanned',
          },
          success: {
            type: 'boolean',
            description: 'Whether the unban was successful',
          },
        },
        required: ['success'],
      },
      metadata: {
        category: 'Moderation',
        tags: ['twitch', 'moderation', 'unban', 'chat', 'user'],
        requiresAuth: true,
        estimatedDuration: 2000,
      },
    },
  ],
  oauth: {
    enabled: true,
    supportsLogin: false,
  },
  getCredentials: async (userId: number) => {
    const { twitchOAuth } = await import('./oauth');
    const userToken = await twitchOAuth.getUserToken(userId);
    return userToken ? { access_token: userToken.token_value } : {};
  },
  ensureWebhookForMapping: async (mapping, userId, actionDefinition) => {
    const { twitchEventSubManager } = await import('./eventSubManager');
    const { twitchOAuth } = await import('./oauth');

    if (!actionDefinition?.metadata?.webhookPattern) {
      return;
    }

    const userToken = await twitchOAuth.getUserToken(userId);
    if (!userToken) {
      console.warn('Cannot create webhook: no Twitch token found for user');
      return;
    }

    const userInfo = await twitchOAuth.getUserInfo(userToken.token_value);
    if (!userInfo) {
      console.warn('Cannot create webhook: failed to get user info');
      return;
    }

    let broadcasterId: string;
    let moderatorId: string;

    if (
      actionDefinition.id === 'twitch.new_follower' ||
      actionDefinition.id === 'twitch.new_subscription'
    ) {
      broadcasterId = userInfo.id;
      moderatorId = userInfo.id;
    } else {
      const broadcasterUsername = mapping.action.config
        ?.broadcaster_username as string;
      if (!broadcasterUsername) {
        console.warn(
          `Cannot create webhook for mapping: missing broadcaster_username in config`
        );
        return;
      }

      const foundBroadcasterId =
        await twitchEventSubManager.getUserId(broadcasterUsername);
      if (!foundBroadcasterId) {
        console.warn(
          `Cannot create webhook: could not find Twitch user ${broadcasterUsername}`
        );
        return;
      }
      broadcasterId = foundBroadcasterId;
      moderatorId = userInfo.id;
    }

    try {
      const subscriptionType = getSubscriptionTypeFromAction(
        actionDefinition.id
      );
      if (!subscriptionType) {
        console.error(`❌ Unsupported action type: ${actionDefinition.id}`);
        return;
      }

      console.log(
        `🔧 Creating webhook for ${actionDefinition.id} -> ${subscriptionType}`
      );

      await twitchEventSubManager.createWebhook(
        userId,
        actionDefinition.id,
        broadcasterId,
        moderatorId
      );
    } catch (error) {
      console.error(`❌ Failed to create webhook for mapping:`, error);
    }
  },
};

export default twitchService;

export { twitchReactionExecutor as executor };

export async function initialize(): Promise<void> {
  const { initializeTwitchPassport } = await import('./passport');
  initializeTwitchPassport();
}

export async function cleanup(): Promise<void> {}
