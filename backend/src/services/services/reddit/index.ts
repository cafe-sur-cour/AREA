import type { Service } from '../../../types/service';
import { redditActions } from './actions';
import { redditReactions } from './reactions';
import { redditReactionExecutor } from './executor';
import { redditScheduler } from './RedditScheduler';
import { getIconSvg } from '../../../utils/iconMapping';

const redditService: Service = {
  id: 'reddit',
  name: 'Reddit',
  description: 'Reddit service for social media integration',
  version: '1.0.0',
  icon: getIconSvg('FaReddit'),
  actions: redditActions,
  reactions: redditReactions,
  oauth: {
    enabled: true,
    supportsLogin: false,
    getSubscriptionUrl: (userId: number) => {
      const baseUrl =
        process.env.SERVICE_REDDIT_API_BASE_URL || 'https://www.reddit.com';
      const clientId = process.env.SERVICE_REDDIT_CLIENT_ID || '';
      const redirectUri = encodeURIComponent(
        process.env.SERVICE_REDDIT_REDIRECT_URI ||
          `${process.env.BACKEND_URL || ''}/api/auth/reddit/callback`
      );
      const state = userId;
      const scope = 'identity read vote submit';

      return `${baseUrl}/api/v1/authorize?client_id=${clientId}&response_type=code&state=${state}&redirect_uri=${redirectUri}&duration=permanent&scope=${encodeURIComponent(scope)}`;
    },
  },
  getCredentials: async (userId: number) => {
    const { redditOAuth } = await import('./oauth');
    const userToken = await redditOAuth.getUserToken(userId);
    return userToken ? { access_token: userToken.token_value } : {};
  },
};

export default redditService;

export { redditReactionExecutor as executor };

export async function initialize(): Promise<void> {
  console.log('Initializing Reddit service...');
  const { initializeRedditPassport } = await import('./passport');
  initializeRedditPassport();
  await redditScheduler.start();
  console.log('Reddit service initialized');
}

export async function cleanup(): Promise<void> {
  console.log('Cleaning up Reddit service...');
  await redditScheduler.stop();
  console.log('Reddit service cleaned up');
}
