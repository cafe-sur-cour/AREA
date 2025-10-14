import type     {
      id: 'twitch.update_channel',
      name: 'Update Channel Title',
      description:
        'Updates the title of the authenticated user\'s own Twitch channel',
      configSchema: twitchUpdateChannelSchema,ice } from '../../../types/service';
import { getIconSvg } from '../../../utils/iconMapping';
import { twitchUpdateChannelSchema } from './schemas';

const twitchService: Service = {
  id: 'twitch',
  name: 'Twitch',
  description: 'Twitch service for live streaming integration',
  version: '1.0.0',
  icon: getIconSvg('FaTwitch'),
  actions: [],
  reactions: [
    {
      id: 'twitch.update_channel',
      name: 'Update Channel Description',
      description:
        'Updates the description of the authenticated user\'s own Twitch channel',
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
