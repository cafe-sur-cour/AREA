import type { Service } from '../../../types/service';
import { githubActions } from './actions';
import { githubReactions } from './reactions';
import { githubReactionExecutor } from './executor';

const githubService: Service = {
  id: 'github',
  name: 'GitHub',
  description: 'GitHub service for repository events and actions',
  version: '1.0.0',
  actions: githubActions,
  reactions: githubReactions,
  getCredentials: async (userId: number) => {
    const { githubOAuth } = await import('./oauth');
    const userToken = await githubOAuth.getUserToken(userId);
    return userToken ? { access_token: userToken.token_value } : {};
  },
};

export default githubService;

export { githubReactionExecutor as executor };

export async function initialize(): Promise<void> {
  console.log('Initializing GitHub service...');
  console.log('GitHub service initialized');
}

export async function cleanup(): Promise<void> {
  console.log('Cleaning up GitHub service...');
  console.log('GitHub service cleaned up');
}
