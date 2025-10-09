import type { Service } from '../../../types/service';
import { microsoftActions } from './actions';
import { microsoftReactions } from './reactions';
import { microsoftReactionExecutor } from './executor';
import { getIconSvg } from '../../../utils/iconMapping';

const microsoftService: Service = {
  id: 'microsoft',
  name: 'Microsoft 365',
  description:
    'Microsoft 365 OAuth service for authentication and Microsoft Graph API integration',
  version: '1.0.0',
  icon: getIconSvg('FaMicrosoft'),
  actions: microsoftActions,
  reactions: microsoftReactions,
  getCredentials: async (userId: number) => {
    const { microsoftOAuth } = await import('./oauth');
    const userToken = await microsoftOAuth.getUserToken(userId);
    return userToken ? { access_token: userToken.token_value } : {};
  },
};

export default microsoftService;

export const executor = microsoftReactionExecutor;

export async function initialize(): Promise<void> {
  console.log('Initializing Microsoft service...');
  console.log('Microsoft service initialized');
}

export async function cleanup(): Promise<void> {
  console.log('Cleaning up Microsoft service...');
  console.log('Microsoft service cleaned up');
}
