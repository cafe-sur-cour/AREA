import type { Service } from '../../../types/service';
import { slackReactionExecutor } from './executor';
import { slackReactions } from './reactions';
import { slackActions } from './actions';

const slackService: Service = {
  id: 'slack',
  name: 'Slack',
  description: 'Slack service for team communication integration',
  version: '1.0.0',
  icon: `<svg stroke="currentColor" fill="#4A154B" stroke-width="0" viewBox="0 0 448 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M94.12 315.1c0 25.9-21.16 47.06-47.06 47.06S0 341 0 315.1c0-25.9 21.16-47.06 47.06-47.06h47.06v47.06zm23.72 0c0-25.9 21.16-47.06 47.06-47.06s47.06 21.16 47.06 47.06v117.84c0 25.9-21.16 47.06-47.06 47.06s-47.06-21.16-47.06-47.06V315.1zm47.06-188.98c-25.9 0-47.06-21.16-47.06-47.06S139 32 164.9 32s47.06 21.16 47.06 47.06v47.06H164.9zm0 23.72c25.9 0 47.06 21.16 47.06 47.06s-21.16 47.06-47.06 47.06H47.06C21.16 243.96 0 222.8 0 196.9s21.16-47.06 47.06-47.06H164.9zm188.98 47.06c0-25.9 21.16-47.06 47.06-47.06 25.9 0 47.06 21.16 47.06 47.06s-21.16 47.06-47.06 47.06h-47.06V196.9zm-23.72 0c0 25.9-21.16 47.06-47.06 47.06-25.9 0-47.06-21.16-47.06-47.06V79.06c0-25.9 21.16-47.06 47.06-47.06 25.9 0 47.06 21.16 47.06 47.06V196.9zM283.1 385.88c25.9 0 47.06 21.16 47.06 47.06 0 25.9-21.16 47.06-47.06 47.06-25.9 0-47.06-21.16-47.06-47.06v-47.06h47.06zm0-23.72c-25.9 0-47.06-21.16-47.06-47.06 0-25.9 21.16-47.06 47.06-47.06h117.84c25.9 0 47.06 21.16 47.06 47.06 0 25.9-21.16 47.06-47.06 47.06H283.1z"></path></svg>`,
  actions: slackActions,
  reactions: slackReactions,
  oauth: {
    enabled: true,
    supportsLogin: false,
  },
  getCredentials: async (userId: number) => {
    const { slackOAuth } = await import('./oauth');
    const userToken = await slackOAuth.getUserToken(userId);
    return userToken ? { access_token: userToken.token_value } : {};
  },
};

export default slackService;

export const executor = slackReactionExecutor;

export async function initialize(): Promise<void> {
  console.log('Initializing Slack service...');
  const { initializeSlackPassport } = await import('./passport');
  initializeSlackPassport();
  console.log('Slack service initialized');
}

export async function cleanup(): Promise<void> {
  console.log('Cleaning up Slack service...');
  // TODO: Cleanup Slack scheduler if needed
  console.log('Slack service cleaned up');
}
