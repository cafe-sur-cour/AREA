import type { Service } from '../../../types/service';

const githubService: Service = {
  id: 'github',
  name: 'GitHub',
  description: 'GitHub service for repository events and actions',
  version: '1.0.0',
  actions: [],
  reactions: [],
};

export default githubService;

export async function initialize(): Promise<void> {
  console.log('Initializing GitHub service...');
  // TODO: No actions/reactions for now, only OAuth
  console.log('GitHub service initialized');
}

export async function cleanup(): Promise<void> {
  console.log('Cleaning up GitHub service...');
  // TODO: No resources to cleanup
  console.log('GitHub service cleaned up');
}
