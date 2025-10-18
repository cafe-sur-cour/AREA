import type { Service } from '../../../types/service';
import { getIconSvg } from '../../../utils/iconMapping';
import { googleActions } from './actions';
import { googleReactions } from './reactions';
import { googleReactionExecutor } from './executor';

const googleService: Service = {
  id: 'google',
  name: 'Google',
  description:
    'Google services integration including Gmail, Calendar, and Drive',
  version: '1.0.0',
  icon: getIconSvg('FaGoogle'),
  actions: googleActions,
  reactions: googleReactions,
  oauth: {
    enabled: true,
    supportsLogin: true,
  },
  getCredentials: async (userId: number) => {
    const { googleOAuth } = await import('./oauth');
    const userToken = await googleOAuth.getUserToken(userId);
    return userToken ? { access_token: userToken.token_value } : {};
  },
  authOnly: false,
};

export default googleService;

export const executor = googleReactionExecutor;

export async function initialize(): Promise<void> {
  console.log('Initializing Google service...');
  const { initializeGooglePassport } = await import('./passport');
  initializeGooglePassport();
  console.log('Google service initialized');
}

export async function cleanup(): Promise<void> {
  console.log('Cleaning up Google service...');
  console.log('Google service cleaned up');
}
