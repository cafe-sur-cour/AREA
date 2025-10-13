import type { Service } from '../../../types/service';
import { getIconSvg } from '../../../utils/iconMapping';

const microsoftService: Service = {
  id: 'microsoft',
  name: 'Microsoft 365',
  description:
    'Microsoft 365 OAuth service for authentication and Microsoft Graph API integration',
  version: '1.0.0',
  icon: getIconSvg('FaMicrosoft'),
  actions: [],
  reactions: [],
  oauth: {
    enabled: true,
    supportsLogin: true,
  },
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
