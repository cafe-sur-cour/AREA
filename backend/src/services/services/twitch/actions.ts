import type { ActionDefinition } from '../../../types/service';
import {
  twitchNewFollowerSchema,
  twitchNewSubscriptionSchema,
} from './schemas';

export const twitchActions: ActionDefinition[] = [
  {
    id: 'twitch.new_follower',
    name: 'Twitch New Follower',
    description: 'Triggers when someone follows your Twitch channel',
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
      sharedEvents: false,
    },
  },
  {
    id: 'twitch.new_subscription',
    name: 'Twitch New Subscription',
    description:
      'Triggers when someone subscribes or renews a subscription to your channel',
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
      sharedEvents: false,
    },
  },
];
