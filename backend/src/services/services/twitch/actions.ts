import type { ActionDefinition } from '../../../types/service';
import {
  twitchNewFollowerSchema,
  twitchNewSubscriptionSchema,
  twitchStreamOnlineSchema,
  twitchStreamOfflineSchema,
} from './schemas';

export const twitchActions: ActionDefinition[] = [
  {
    id: 'twitch.new_follower',
    name: 'Twitch New Follower',
    description: 'Triggers when someone follows the specified Twitch channel',
    configSchema: twitchNewFollowerSchema,
    inputSchema: {
      type: 'object',
      properties: {
        user_id: {
          type: 'string',
          description: 'The user ID of the follower',
        },
        user_login: {
          type: 'string',
          description: 'The user login of the follower',
        },
        user_name: {
          type: 'string',
          description: 'The user display name of the follower',
        },
        broadcaster_user_id: {
          type: 'string',
          description: 'The broadcaster user ID',
        },
        broadcaster_user_login: {
          type: 'string',
          description: 'The broadcaster user login',
        },
        broadcaster_user_name: {
          type: 'string',
          description: 'The broadcaster display name',
        },
        followed_at: {
          type: 'string',
          description: 'RFC3339 timestamp of when the follow occurred',
        },
      },
      required: ['user_id', 'user_login', 'broadcaster_user_id', 'followed_at'],
    },
    metadata: {
      category: 'Twitch',
      tags: ['twitch', 'follower', 'channel'],
      requiresAuth: true,
      webhookPattern: 'channel.follow',
      sharedEvents: true,
      sharedEventFilter: event => {
        const broadcasterUserId = (
          event.payload as { broadcaster_user_id?: string }
        )?.broadcaster_user_id;
        if (!broadcasterUserId) return false;

        return true;
      },
    },
  },
  {
    id: 'twitch.new_subscription',
    name: 'Twitch New Subscription',
    description:
      'Triggers when someone subscribes or renews a subscription to the specified channel',
    configSchema: twitchNewSubscriptionSchema,
    inputSchema: {
      type: 'object',
      properties: {
        user_id: {
          type: 'string',
          description: 'The user ID of the subscriber',
        },
        user_login: {
          type: 'string',
          description: 'The user login of the subscriber',
        },
        user_name: {
          type: 'string',
          description: 'The user display name of the subscriber',
        },
        broadcaster_user_id: {
          type: 'string',
          description: 'The broadcaster user ID',
        },
        broadcaster_user_login: {
          type: 'string',
          description: 'The broadcaster user login',
        },
        broadcaster_user_name: {
          type: 'string',
          description: 'The broadcaster display name',
        },
        tier: {
          type: 'string',
          description: 'The tier of the subscription (1000, 2000, or 3000)',
        },
        is_gift: {
          type: 'boolean',
          description: 'Whether the subscription is a gift',
        },
        message: {
          type: 'object',
          description: 'Subscription message details',
          properties: {
            text: {
              type: 'string',
              description: 'The subscription message text',
            },
            emotes: {
              type: 'array',
              description: 'Emotes in the message',
              items: {
                type: 'object',
                description: 'Emote information',
                properties: {
                  begin: { type: 'number', description: 'Start position' },
                  end: { type: 'number', description: 'End position' },
                  id: { type: 'string', description: 'Emote ID' },
                },
              },
            },
          },
        },
      },
      required: ['user_id', 'user_login', 'broadcaster_user_id', 'tier'],
    },
    metadata: {
      category: 'Twitch',
      tags: ['twitch', 'subscription', 'channel'],
      requiresAuth: true,
      webhookPattern: 'channel.subscribe',
      sharedEvents: true,
      sharedEventFilter: event => {
        const broadcasterUserId = (
          event.payload as { broadcaster_user_id?: string }
        )?.broadcaster_user_id;
        if (!broadcasterUserId) return false;

        return true;
      },
    },
  },
  {
    id: 'twitch.stream_online',
    name: 'Twitch Stream Online',
    description: 'Triggers when the specified Twitch channel goes online',
    configSchema: twitchStreamOnlineSchema,
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'The stream ID',
        },
        broadcaster_user_id: {
          type: 'string',
          description: 'The broadcaster user ID',
        },
        broadcaster_user_login: {
          type: 'string',
          description: 'The broadcaster user login',
        },
        broadcaster_user_name: {
          type: 'string',
          description: 'The broadcaster display name',
        },
        type: {
          type: 'string',
          description: 'The stream type (live)',
        },
        started_at: {
          type: 'string',
          description: 'RFC3339 timestamp of when the stream started',
        },
      },
      required: [
        'id',
        'broadcaster_user_id',
        'broadcaster_user_login',
        'type',
        'started_at',
      ],
    },
    metadata: {
      category: 'Twitch',
      tags: ['twitch', 'stream', 'online'],
      requiresAuth: true,
      webhookPattern: 'stream.online',
      sharedEvents: true,
      sharedEventFilter: event => {
        const broadcasterUserId = (
          event.payload as { broadcaster_user_id?: string }
        )?.broadcaster_user_id;
        if (!broadcasterUserId) return false;

        return true;
      },
    },
  },
  {
    id: 'twitch.stream_offline',
    name: 'Twitch Stream Offline',
    description: 'Triggers when the specified Twitch channel goes offline',
    configSchema: twitchStreamOfflineSchema,
    inputSchema: {
      type: 'object',
      properties: {
        broadcaster_user_id: {
          type: 'string',
          description: 'The broadcaster user ID',
        },
        broadcaster_user_login: {
          type: 'string',
          description: 'The broadcaster user login',
        },
        broadcaster_user_name: {
          type: 'string',
          description: 'The broadcaster display name',
        },
      },
      required: ['broadcaster_user_id', 'broadcaster_user_login'],
    },
    metadata: {
      category: 'Twitch',
      tags: ['twitch', 'stream', 'offline'],
      requiresAuth: true,
      webhookPattern: 'stream.offline',
      sharedEvents: true,
      sharedEventFilter: event => {
        const broadcasterUserId = (
          event.payload as { broadcaster_user_id?: string }
        )?.broadcaster_user_id;
        if (!broadcasterUserId) return false;

        return true;
      },
    },
  },
];
