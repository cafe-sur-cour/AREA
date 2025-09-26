import type { Service } from '../../../types/service';
import { githubActions } from './actions';

const githubService: Service = {
  id: 'github',
  name: 'GitHub',
  description: 'GitHub service for repository events and actions',
  version: '1.0.0',
  actions: githubActions,
  reactions: [], // githubReactions,
};

export default githubService;

export async function initialize(): Promise<void> {
  console.log('Initializing GitHub service...');
  console.log('GitHub service initialized');
}

export async function cleanup(): Promise<void> {
  console.log('Cleaning up GitHub service...');
  console.log('GitHub service cleaned up');
}
