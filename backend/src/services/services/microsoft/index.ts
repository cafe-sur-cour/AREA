import type { Service } from '../../../types/service';

const microsoftService: Service = {
  id: 'microsoft',
  name: 'Microsoft 365',
  description:
    'Microsoft 365 OAuth service for authentication and Microsoft Graph API integration',
  version: '1.0.0',
  icon: `<svg stroke="currentColor" fill="#00A4EF" stroke-width="0" viewBox="0 0 448 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M0 32h214.6v214.6H0V32zm233.4 0H448v214.6H233.4V32zM0 265.4h214.6V480H0V265.4zm233.4 0H448V480H233.4V265.4z"></path></svg>`,
  actions: [],
  reactions: [],
  oauth: {
    enabled: true,
    supportsLogin: true,
  },
  authOnly: true,
};

export default microsoftService;

export async function initialize(): Promise<void> {
  console.log('Initializing Microsoft service...');
  const { initializeMicrosoftPassport } = await import('./passport');
  initializeMicrosoftPassport();
  console.log('Microsoft service initialized');
}

export async function cleanup(): Promise<void> {
  console.log('Cleaning up Microsoft service...');
  console.log('Microsoft service cleaned up');
}
