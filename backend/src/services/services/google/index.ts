import type { Service } from '../../../types/service';
import { googleActions } from './actions';
import { googleReactions } from './reactions';
import { googleReactionExecutor } from './executor';

const googleService: Service = {
  id: 'google',
  name: 'Google',
  description:
    'Google services integration including Gmail, Calendar, and Drive',
  version: '1.0.0',
  icon: `<svg stroke="currentColor" fill="#4285F4" stroke-width="0" viewBox="0 0 488 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h240z"></path></svg>`,
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
