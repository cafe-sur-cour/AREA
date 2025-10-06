import type { Service } from '../../../types/service';

const microsoftService: Service = {
  id: 'microsoft',
  name: 'Microsoft 365',
  description: 'Microsoft 365 OAuth service for authentication',
  version: '1.0.0',
  actions: [],
  reactions: [],
};

export default microsoftService;

export async function initialize(): Promise<void> {
  console.log('Initializing Microsoft service...');
  console.log('Microsoft service initialized');
}

export async function cleanup(): Promise<void> {
  console.log('Cleaning up Microsoft service...');
  console.log('Microsoft service cleaned up');
}