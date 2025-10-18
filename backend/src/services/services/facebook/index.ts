import type { Service } from '../../../types/service';
import { getIconSvg } from '../../../utils/iconMapping';

const facebookservice: Service = {
  id: 'facebook',
  name: 'Facebook',
  description:
    'Facebook OAuth service for authentication and platform integration',
  version: '1.0.0',
  icon: getIconSvg('FaMeta'),
  actions: [],
  reactions: [],
  oauth: {
    enabled: true,
    supportsLogin: true,
  },
  authOnly: false,
};

export default facebookservice;

export async function initialize(): Promise<void> {
  console.log('Initializing Meta service...');
  const { initializeFacebookPassport } = await import('./passport');
  initializeFacebookPassport();
  console.log('Meta service initialized');
}

export async function cleanup(): Promise<void> {
  console.log('Cleaning up Meta service...');
  console.log('Facebook service cleaned up');
}
