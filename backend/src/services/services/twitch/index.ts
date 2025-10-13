import type { Service } from '../../../types/service';
import { getIconSvg } from '../../../utils/iconMapping';

const twitchService: Service = {
  id: 'twitch',
  name: 'Twitch',
  description: 'Twitch service for live streaming integration',
  version: '1.0.0',
  icon: getIconSvg('FaTwitch'),
  actions: [],
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
};

export default twitchService;

export async function initialize(): Promise<void> {
  console.log('✅ Twitch service initialized');
}

export async function cleanup(): Promise<void> {
  console.log('🔄 Twitch service cleanup complete');
}
