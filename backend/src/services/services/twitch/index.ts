import type { Service } from '../../../types/service';
import { getIconSvg } from '../../../utils/iconMapping';
import {
  twitchFollowChannelSchema,
  twitchUnfollowChannelSchema,
} from './schemas';

const twitchService: Service = {
  id: 'twitch',
  name: 'Twitch',
  description: 'Twitch service for live streaming integration',
  version: '1.0.0',
  icon: getIconSvg('FaTwitch'),
  actions: [],
  reactions: [
    {
      id: 'twitch.follow_channel',
      name: 'Follow a Channel',
      description:
        'Follows a specified Twitch channel on behalf of the authenticated user',
      configSchema: twitchFollowChannelSchema,
      outputSchema: {
        type: 'object',
        properties: {
          broadcaster_id: {
            type: 'string',
            description: 'The ID of the channel that was followed',
          },
          success: {
            type: 'boolean',
            description: 'Whether the follow was successful',
          },
        },
        required: ['success'],
      },
      metadata: {
        category: 'Social',
        tags: ['twitch', 'follow', 'channel', 'streaming'],
        requiresAuth: true,
        estimatedDuration: 2000,
      },
    },
    {
      id: 'twitch.unfollow_channel',
      name: 'Unfollow a Channel',
      description:
        'Unfollows a specified Twitch channel on behalf of the authenticated user',
      configSchema: twitchUnfollowChannelSchema,
      outputSchema: {
        type: 'object',
        properties: {
          broadcaster_id: {
            type: 'string',
            description: 'The ID of the channel that was unfollowed',
          },
          success: {
            type: 'boolean',
            description: 'Whether the unfollow was successful',
          },
        },
        required: ['success'],
      },
      metadata: {
        category: 'Social',
        tags: ['twitch', 'unfollow', 'channel', 'streaming'],
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
};

export default twitchService;

export async function initialize(): Promise<void> {
  console.log('Initializing Twitch service...');
  const { initializeTwitchPassport } = await import('./passport');
  initializeTwitchPassport();
  console.log('✅ Twitch service initialized');
}

export async function cleanup(): Promise<void> {
  console.log('🔄 Twitch service cleanup complete');
}

export { twitchReactionExecutor as executor } from './executor';
