import type { Service } from '../../../types/service';
import { getIconSvg } from '../../../utils/iconMapping';
import { twitchActions } from './actions';
import { twitchEventSubManager } from './eventSubManager';

const twitchService: Service = {
  id: 'twitch',
  name: 'Twitch',
  description: 'Twitch service for live streaming integration',
  version: '1.0.0',
  icon: getIconSvg('FaTwitch'),
  actions: twitchActions,
  reactions: [],
  oauth: {
    enabled: true,
    supportsLogin: false,
  },
  getCredentials: async (userId: number) => {
    const { twitchOAuth } = await import('./oauth');
    const userToken = await twitchOAuth.getUserToken(userId);
    return userToken ? { access_token: userToken.token_value } : {};
  },
  ensureWebhookForMapping: async (mapping, userId) => {
    try {
      const { twitchOAuth } = await import('./oauth');
      const userToken = await twitchOAuth.getUserToken(userId);

      if (!userToken) {
        throw new Error('No Twitch token found for user');
      }

      const broadcasterUsername = mapping.action.config
        ?.broadcaster_username as string;
      if (!broadcasterUsername) {
        throw new Error('Broadcaster username not found in mapping config');
      }

      const broadcasterId =
        await twitchEventSubManager.getUserId(broadcasterUsername);
      if (!broadcasterId) {
        throw new Error(`Could not find Twitch user: ${broadcasterUsername}`);
      }

      await twitchEventSubManager.createAllSubscriptions(userId, broadcasterId);

      console.log(
        `✅ Created EventSub subscriptions for Twitch mapping (user: ${userId}, broadcaster: ${broadcasterId})`
      );
    } catch (error) {
      console.error('Failed to create Twitch EventSub subscriptions:', error);
      throw error;
    }
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
