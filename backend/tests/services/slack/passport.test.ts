// Mock passport-custom before importing
let mockStrategyCallback: any;
const MockCustomStrategy = jest.fn(callback => {
  mockStrategyCallback = callback;
  return {};
});

jest.mock('passport-custom', () => ({
  Strategy: MockCustomStrategy,
}));

// Mock passport with proper methods
jest.mock('passport', () => ({
  initialize: jest.fn(() => (req: any, res: any, next: any) => next()),
  session: jest.fn(() => (req: any, res: any, next: any) => next()),
  use: jest.fn(),
  authenticate: jest.fn(),
  serializeUser: jest.fn(),
  deserializeUser: jest.fn(),
}));

jest.mock('../../../src/utils/auth', () => ({
  getCurrentUser: jest.fn(),
}));

jest.mock('../../../src/routes/auth/auth.service', () => ({
  connectOAuthProvider: jest.fn(),
}));

jest.mock('jsonwebtoken', () => ({
  verify: jest.fn(),
}));

jest.mock('../../../src/services/services/slack/oauth', () => ({
  slackOAuth: {
    exchangeCodeForToken: jest.fn(),
    getUserInfo: jest.fn(),
    storeUserToken: jest.fn(),
  },
}));

jest.mock('../../../index', () => ({
  JWT_SECRET: 'test_secret',
}));

jest.mock('../../../src/services/ServiceSubscriptionManager', () => ({
  serviceSubscriptionManager: {
    subscribeUser: jest.fn(),
  },
}));

import passport from 'passport';
import { getCurrentUser } from '../../../src/utils/auth';
import { connectOAuthProvider } from '../../../src/routes/auth/auth.service';
import { slackOAuth } from '../../../src/services/services/slack/oauth';
import jwt from 'jsonwebtoken';

describe('Slack Passport Strategy', () => {
  let initializeSlackPassport: () => void;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockStrategyCallback = undefined;

    const module = await import(
      '../../../src/services/services/slack/passport'
    );
    initializeSlackPassport = module.initializeSlackPassport;
  });

  describe('initializeSlackPassport', () => {
    it('should register slack-subscribe strategy', () => {
      initializeSlackPassport();

      expect(passport.use).toHaveBeenCalledWith(
        'slack-subscribe',
        expect.anything()
      );
      expect(MockCustomStrategy).toHaveBeenCalled();
      expect(mockStrategyCallback).toBeDefined();
    });
  });

  describe('strategy callback', () => {
    beforeEach(() => {
      initializeSlackPassport();
    });

    it('should return error when user not authenticated', async () => {
      (getCurrentUser as jest.Mock).mockResolvedValue(null);

      const req = { query: { code: 'test_code' } } as any;
      const done = jest.fn();

      await mockStrategyCallback(req, done);

      expect(done).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'User not authenticated' }),
        null
      );
    });

    it('should return error when authorization code is missing', async () => {
      (getCurrentUser as jest.Mock).mockResolvedValue({
        id: 1,
        email: 'test@example.com',
      });

      const req = { query: {} } as any;
      const done = jest.fn();

      await mockStrategyCallback(req, done);

      expect(done).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Authorization code is missing' }),
        null
      );
    });

    it('should successfully authenticate user', async () => {
      (getCurrentUser as jest.Mock).mockResolvedValue({
        id: 1,
        email: 'test@example.com',
      });
      (slackOAuth.exchangeCodeForToken as jest.Mock).mockResolvedValue({
        access_token: 'xoxb-token',
        scope: 'channels:read,chat:write',
      });
      (slackOAuth.getUserInfo as jest.Mock).mockResolvedValue({
        user: {
          id: 'U123',
          name: 'testuser',
          real_name: 'Test User',
          profile: {
            email: 'test@slack.com',
            display_name: 'Test',
          },
        },
      });
      (connectOAuthProvider as jest.Mock).mockResolvedValue('jwt_token_here');
      (jwt.verify as jest.Mock).mockReturnValue({ id: 1 });

      const { serviceSubscriptionManager } = await import(
        '../../../src/services/ServiceSubscriptionManager'
      );
      (serviceSubscriptionManager.subscribeUser as jest.Mock).mockResolvedValue(
        undefined
      );

      const req = { query: { code: 'test_code' } } as any;
      const done = jest.fn();

      await mockStrategyCallback(req, done);

      expect(slackOAuth.exchangeCodeForToken).toHaveBeenCalledWith('test_code');
      expect(slackOAuth.getUserInfo).toHaveBeenCalledWith('xoxb-token');
      expect(connectOAuthProvider).toHaveBeenCalledWith(
        1,
        'slack',
        'U123',
        'test@slack.com',
        'Test User'
      );
      expect(slackOAuth.storeUserToken).toHaveBeenCalled();
      expect(done).toHaveBeenCalledWith(null, {
        id: 'U123',
        name: 'Test User',
        email: 'test@slack.com',
        token: 'jwt_token_here',
      });
    });

    it('should handle connectOAuthProvider error', async () => {
      (getCurrentUser as jest.Mock).mockResolvedValue({
        id: 1,
        email: 'test@example.com',
      });
      (slackOAuth.exchangeCodeForToken as jest.Mock).mockResolvedValue({
        access_token: 'xoxb-token',
        scope: 'channels:read',
      });
      (slackOAuth.getUserInfo as jest.Mock).mockResolvedValue({
        user: {
          id: 'U123',
          name: 'testuser',
          real_name: 'Test User',
          profile: {
            email: 'test@slack.com',
          },
        },
      });
      (connectOAuthProvider as jest.Mock).mockResolvedValue(
        new Error('Connection failed')
      );

      const req = { query: { code: 'test_code' } } as any;
      const done = jest.fn();

      await mockStrategyCallback(req, done);

      expect(done).toHaveBeenCalledWith(expect.any(Error), null);
    });

    it('should handle subscription error gracefully', async () => {
      (getCurrentUser as jest.Mock).mockResolvedValue({
        id: 1,
        email: 'test@example.com',
      });
      (slackOAuth.exchangeCodeForToken as jest.Mock).mockResolvedValue({
        access_token: 'xoxb-token',
        scope: 'channels:read',
      });
      (slackOAuth.getUserInfo as jest.Mock).mockResolvedValue({
        user: {
          id: 'U123',
          name: 'testuser',
          real_name: 'Test User',
          profile: {
            email: 'test@slack.com',
          },
        },
      });
      (connectOAuthProvider as jest.Mock).mockResolvedValue('jwt_token');
      (jwt.verify as jest.Mock).mockReturnValue({ id: 1 });

      const { serviceSubscriptionManager } = await import(
        '../../../src/services/ServiceSubscriptionManager'
      );
      (serviceSubscriptionManager.subscribeUser as jest.Mock).mockRejectedValue(
        new Error('Subscription failed')
      );

      const req = { query: { code: 'test_code' } } as any;
      const done = jest.fn();

      await mockStrategyCallback(req, done);

      expect(done).toHaveBeenCalledWith(
        null,
        expect.objectContaining({
          id: 'U123',
          token: 'jwt_token',
        })
      );
    });

    it('should handle general errors', async () => {
      (getCurrentUser as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      const req = { query: { code: 'test_code' } } as any;
      const done = jest.fn();

      await mockStrategyCallback(req, done);

      expect(done).toHaveBeenCalledWith(expect.any(Error), null);
    });

    it('should use empty string for missing email', async () => {
      (getCurrentUser as jest.Mock).mockResolvedValue({
        id: 1,
        email: 'test@example.com',
      });
      (slackOAuth.exchangeCodeForToken as jest.Mock).mockResolvedValue({
        access_token: 'xoxb-token',
        scope: 'channels:read',
      });
      (slackOAuth.getUserInfo as jest.Mock).mockResolvedValue({
        user: {
          id: 'U123',
          name: 'testuser',
          real_name: 'Test User',
          profile: {},
        },
      });
      (connectOAuthProvider as jest.Mock).mockResolvedValue('jwt_token');
      (jwt.verify as jest.Mock).mockReturnValue({ id: 1 });

      const { serviceSubscriptionManager } = await import(
        '../../../src/services/ServiceSubscriptionManager'
      );
      (serviceSubscriptionManager.subscribeUser as jest.Mock).mockResolvedValue(
        undefined
      );

      const req = { query: { code: 'test_code' } } as any;
      const done = jest.fn();

      await mockStrategyCallback(req, done);

      expect(connectOAuthProvider).toHaveBeenCalledWith(
        1,
        'slack',
        'U123',
        '',
        'Test User'
      );
      expect(done).toHaveBeenCalledWith(
        null,
        expect.objectContaining({
          email: '',
        })
      );
    });

    it('should use name as fallback for real_name', async () => {
      (getCurrentUser as jest.Mock).mockResolvedValue({
        id: 1,
        email: 'test@example.com',
      });
      (slackOAuth.exchangeCodeForToken as jest.Mock).mockResolvedValue({
        access_token: 'xoxb-token',
        scope: 'channels:read',
      });
      (slackOAuth.getUserInfo as jest.Mock).mockResolvedValue({
        user: {
          id: 'U123',
          name: 'testuser',
          profile: {
            email: 'test@slack.com',
          },
        },
      });
      (connectOAuthProvider as jest.Mock).mockResolvedValue('jwt_token');
      (jwt.verify as jest.Mock).mockReturnValue({ id: 1 });

      const { serviceSubscriptionManager } = await import(
        '../../../src/services/ServiceSubscriptionManager'
      );
      (serviceSubscriptionManager.subscribeUser as jest.Mock).mockResolvedValue(
        undefined
      );

      const req = { query: { code: 'test_code' } } as any;
      const done = jest.fn();

      await mockStrategyCallback(req, done);

      expect(connectOAuthProvider).toHaveBeenCalledWith(
        1,
        'slack',
        'U123',
        'test@slack.com',
        'testuser'
      );
      expect(done).toHaveBeenCalledWith(
        null,
        expect.objectContaining({
          name: 'testuser',
        })
      );
    });
  });
});
