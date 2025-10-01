import type { Service } from '../../../types/service';

const googleService: Service = {
  id: 'google',
  name: 'Google',
  description: 'Google OAuth service for authentication',
  version: '1.0.0',
  actions: [],
  reactions: [],
};

export default googleService;

export async function initialize(): Promise<void> {
  console.log('Initializing Google service...');
  console.log('Google service initialized');
}

export async function cleanup(): Promise<void> {
  console.log('Cleaning up Google service...');
  console.log('Google service cleaned up');
}
