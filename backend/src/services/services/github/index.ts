import type { Service } from '../../../types/service';
import { githubActions } from './actions';
import { githubReactions } from './reactions';
import { githubReactionExecutor } from './executor';
import { getIconSvg } from '../../../utils/iconMapping';

const githubService: Service = {
  id: 'github',
  name: 'GitHub',
  description: 'GitHub service for repository events and actions',
  version: '1.0.0',
  icon: getIconSvg('FaGithub'),
  actions: githubActions,
  reactions: githubReactions,
  oauth: {
    enabled: true,
    supportsLogin: true,
  },
  getCredentials: async (userId: number) => {
    const { githubOAuth } = await import('./oauth');
    const userToken = await githubOAuth.getUserToken(userId);
    return userToken ? { access_token: userToken.token_value } : {};
  },
  deleteWebhook: async (userId: number, webhookId: number) => {
    const { githubWebhookManager } = await import('./webhookManager');
    await githubWebhookManager.deleteWebhook(userId, webhookId);
  },
  ensureWebhookForMapping: async (mapping, userId, actionDefinition) => {
    const { githubWebhookManager } = await import('./webhookManager');

    if (!actionDefinition?.metadata?.webhookPattern) {
      return;
    }

    const repository = mapping.action.config?.repository as string;
    if (!repository) {
      console.warn(
        `Cannot create webhook for mapping: missing repository in config`
      );
      return;
    }

    const events = [actionDefinition.metadata.webhookPattern];

    console.log(
      `Ensuring GitHub webhook exists for ${repository} with events: ${events.join(', ')}`
    );

    try {
      await githubWebhookManager.createWebhook(userId, {
        repository,
        events,
      });
      console.log(`✅ Webhook ensured for mapping`);
    } catch (error) {
      console.error(`❌ Failed to create webhook for mapping:`, error);
    }
  },
};

export default githubService;

export { githubReactionExecutor as executor };

export async function initialize(): Promise<void> {
  console.log('Initializing GitHub service...');
  const { initializeGitHubPassport } = await import('./passport');
  initializeGitHubPassport();
  console.log('GitHub service initialized');
}

export async function cleanup(): Promise<void> {
  console.log('Cleaning up GitHub service...');
  console.log('GitHub service cleaned up');
}
