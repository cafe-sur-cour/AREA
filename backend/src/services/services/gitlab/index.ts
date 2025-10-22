import type { Service } from '../../../types/service';

const gitlabService: Service = {
  id: 'gitlab',
  name: 'GitLab',
  description: 'GitLab service for repository events and actions',
  version: '1.0.0',
  icon: `<svg stroke="currentColor" fill="#FC6D26" stroke-width="0" viewBox="0 0 512 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M256.5 32L256 42.48 72 200.32 72 448h368V200.32L256.5 32zm0 0M72 200.32l184.5-167.84L256 42.48V42.48L441 200.32M72 200.32h368v247.68H72z"></path></svg>`,
  actions: [],
  reactions: [],
  oauth: {
    enabled: true,
    supportsLogin: true,
  },
  getCredentials: async (userId: number) => {
    const { gitlabOAuth } = await import('./oauth');
    const userToken = await gitlabOAuth.getUserToken(userId);
    return userToken ? { access_token: userToken.token_value } : {};
  },
  deleteWebhook: async () => {
    // TODO: Implement webhook deletion
  },
  ensureWebhookForMapping: async () => {
    // TODO: Implement webhook creation for mappings
  },
};

export default gitlabService;

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
