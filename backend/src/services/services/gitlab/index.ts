import type { Service } from '../../../types/service';
import { gitlabActions } from './action';
import { gitlabReactions } from './reactions';
import { gitlabReactionExecutor } from './executor';


const gitlabService: Service = {
  id: 'gitlab',
  name: 'GitLab',
  description: 'GitLab service for repository events and actions',
  version: '1.0.0',
  icon: `<svg stroke="currentColor" fill="#FC6D26" stroke-width="0" viewBox="0 0 512 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M256.5 32L256 42.48 72 200.32 72 448h368V200.32L256.5 32zm0 0M72 200.32l184.5-167.84L256 42.48V42.48L441 200.32M72 200.32h368v247.68H72z"></path></svg>`,
  actions: gitlabActions,
  reactions: gitlabReactions,
  oauth: {
    enabled: true,

    // supportsLogin: true,
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



// area_server  | 
// area_server  | 🎣 [SLACK WEBHOOK] Event received (team: T09KRK2SDQD)
// area_server  | 🔍 [SLACK TEAM] Looking for token for team T09KRK2SDQD
// area_server  | 📋 [SLACK TEAM] Found 1 potential tokens
// area_server  | 🔑 [SLACK TEAM] Testing token for user 3
// area_server  | ✅ [SLACK TEAM] Token valid, team_id: T09KRK2SDQD
// area_server  | 🎯 [SLACK TEAM] Token matches team T09KRK2SDQD for user 3
// area_server  | ✅ [SLACK WEBHOOK] Found token for user 3 (team: T09KRK2SDQD)
// area_server  | 🎣 [SLACK WEBHOOK] Processing message → slack.new_message
// area_server  | ✅ [SLACK WEBHOOK] Event processed successfully (ID: 3)
// area_server  | 🔄 [ExecutionService] Processing event 3 - Action: slack.new_message, mapping_id: null
// area_server  | 🔄 [ExecutionService] Event 3 marked as processing to prevent duplicate execution
// area_server  | 🚀 [ExecutionService] Processing event 3 - Action: slack.new_message
// area_server  | 🔍 [ExecutionService] Loading mappings for action: slack.new_message, user: 3
// area_server  | 🔍 [ExecutionService] Searching for mappings with shared action type: slack.new_message for all users
// area_server  | 📊 [ExecutionService] Found 1 active mappings for shared action slack.new_message across all users
// area_server  | 📋 [ExecutionService] Found 1 active mapping(s) for user 3
// area_server  | 🎯 [ExecutionService] Starting execution of 1 mapping(s)...
// area_server  | ⚡ [ExecutionService] Executing immediate reaction gitlab.create_issue
// area_server  | 🔑 [ExecutionService] Executing reaction for mapping 2 (reactuin) owned by user 3
// area_server  | ❌ [ExecutionService] Reaction attempt 1 failed for gitlab.create_issue: No executor registered for service: gitlab
// area_server  | 🔑 [ExecutionService] Executing reaction for mapping 2 (reactuin) owned by user 3
// area_server  | ❌ [ExecutionService] Reaction attempt 2 failed for gitlab.create_issue: No executor registered for service: gitlab
// area_server  | 🔑 [ExecutionService] Executing reaction for mapping 2 (reactuin) owned by user 3
// area_server  | ❌ [ExecutionService] Reaction attempt 3 failed for gitlab.create_issue: No executor registered for service: gitlab
// area_server  | ❌ [ExecutionService] Reaction gitlab.create_issue failed after all retries, continuing with other reactions: No executor registered for service: gitlab
// area_server  | ✅ [ExecutionService] Event 3 processed successfully
