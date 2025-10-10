import type { Service } from '../../../types/service';
import { slackReactionExecutor } from './executor';
import { getIconSvg } from '../../../utils/iconMapping';
import { slackReactions } from './reactions';

const slackService: Service = {
  id: 'slack',
  name: 'Slack',
  description: 'Slack service for team communication integration',
  version: '1.0.0',
  icon: getIconSvg('FaSlack'),
  actions: [], // TODO: Add Slack actions later
  reactions: slackReactions,
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
  // TODO: Initialize Slack scheduler if needed
  console.log('Slack service initialized');
}

export async function cleanup(): Promise<void> {
  console.log('Cleaning up Slack service...');
  // TODO: Cleanup Slack scheduler if needed
  console.log('Slack service cleaned up');
}
