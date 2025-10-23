import type { Service } from '../../../types/service';
import { gitlabActions } from './action';
import { gitlabReactions } from './reactions';
import { gitlabReactionExecutor } from './executor';


const gitlabService: Service = {
  id: 'gitlab',
  name: 'GitLab',
  description: 'GitLab service for repository events and actions',
  version: '1.0.0',
  icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#FC6D26" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-brand-gitlab"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M21 14l-9 7l-9 -7l3 -11l3 7h6l3 -7z" /></svg>`,
  actions: gitlabActions,
  reactions: gitlabReactions,
  oauth: {
    enabled: true,
  },
  getCredentials: async (userId: number) => {
    const { gitlabOAuth } = await import('./oauth');
    const userToken = await gitlabOAuth.getUserToken(userId);
    return userToken ? { access_token: userToken.token_value } : {};
  },
  deleteWebhook: async (userId: number, webhookId: number) => {
    const { gitlabWebhookManager } = await import('./webhookManager');
    await gitlabWebhookManager.deleteWebhook(userId, webhookId);
  },
  ensureWebhookForMapping: async (mapping, userId, actionDefinition) => {
    const { gitlabWebhookManager } = await import('./webhookManager');

    if (!actionDefinition?.metadata?.webhookPattern) {
      return;
    }

    const project = mapping.action.config?.project as string;
    if (!project) {
      console.warn(
        `Cannot create webhook for mapping: missing project in config`
      );
      return;
    }

    const events = [actionDefinition.metadata.webhookPattern];

    console.log(
      `Ensuring GitLab webhook exists for ${project} with events: ${events.join(', ')}`
    );

    try {
      await gitlabWebhookManager.createWebhook(userId, {
        project,
        events,
      });
      console.log(`✅ Webhook ensured for mapping`);
    } catch (error) {
      console.error(`❌ Failed to create webhook for mapping:`, error);
    }
  },
};

export default gitlabService;

export { gitlabReactionExecutor as executor };

export async function initialize(): Promise<void> {
  console.log('Initializing GitLab service...');
  const { initializeGitLabPassport } = await import('./passport');
  initializeGitLabPassport();
  console.log('GitLab service initialized');
}

export async function cleanup(): Promise<void> {
  console.log('Cleaning up GitLab service...');
  console.log('GitLab service cleaned up');
}
