// Mock node-fetch before importing oauth.ts to avoid ESM issues
const mockFetch = jest.fn() as jest.MockedFunction<typeof fetch>;
jest.mock('node-fetch', () => mockFetch);
global.fetch = mockFetch;

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
  oauthLogin: jest.fn(),
  connectOAuthProvider: jest.fn(),
}));

jest.mock('jsonwebtoken', () => ({
  verify: jest.fn(),
}));

jest.mock('../../../src/services/services/microsoft/oauth', () => ({
  microsoftOAuth: {
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
import {
  oauthLogin,
  connectOAuthProvider,
} from '../../../src/routes/auth/auth.service';
import { microsoftOAuth } from '../../../src/services/services/microsoft/oauth';
import jwt from 'jsonwebtoken';

describe('Microsoft Passport Strategy', () => {
  let initializeMicrosoftPassport: () => void;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockStrategyCallback = undefined;

    const module = await import(
      '../../../src/services/services/microsoft/passport'
    );
    initializeMicrosoftPassport = module.initializeMicrosoftPassport;
  });

  describe('initializeMicrosoftPassport', () => {
    it('should register microsoft-login and microsoft-subscribe strategies', () => {
      initializeMicrosoftPassport();

      expect(passport.use).toHaveBeenCalledWith(
        'microsoft-login',
        expect.anything()
      );
      expect(passport.use).toHaveBeenCalledWith(
        'microsoft-subscribe',
        expect.anything()
      );
      expect(MockCustomStrategy).toHaveBeenCalledTimes(2);
    });
  });

  describe('microsoft-login strategy', () => {
    beforeEach(() => {
      initializeMicrosoftPassport();
      // Get the login strategy callback (first call to MockCustomStrategy)
      mockStrategyCallback = MockCustomStrategy.mock.calls[0][0];
    });

    it('should return error when authorization code is missing', async () => {
      const req = { query: {} } as any;
      const done = jest.fn();

      await mockStrategyCallback(req, done);

      expect(done).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Authorization code is missing' }),
        null
      );
    });

    it('should successfully authenticate user for login', async () => {
      (microsoftOAuth.exchangeCodeForToken as jest.Mock).mockResolvedValue({
        access_token: 'access-token',
        token_type: 'Bearer',
        expires_in: 3600,
        refresh_token: 'refresh-token',
        scope: 'openid email profile User.Read offline_access',
      });
      (microsoftOAuth.getUserInfo as jest.Mock).mockResolvedValue({
        id: 'user-id',
        userPrincipalName: 'user@example.com',
        displayName: 'Test User',
        givenName: 'Test',
        surname: 'User',
        mail: 'user@example.com',
      });
      (oauthLogin as jest.Mock).mockResolvedValue('jwt_token_here');
      (jwt.verify as jest.Mock).mockReturnValue({ id: 1 });

      const req = { query: { code: 'test_code' } } as any;
      const done = jest.fn();

      await mockStrategyCallback(req, done);

      expect(microsoftOAuth.exchangeCodeForToken).toHaveBeenCalledWith(
        'test_code'
      );
      expect(microsoftOAuth.getUserInfo).toHaveBeenCalledWith('access-token');
      expect(oauthLogin).toHaveBeenCalledWith(
        'microsoft',
        'user-id',
        'user@example.com',
        'Test User'
      );
      expect(microsoftOAuth.storeUserToken).toHaveBeenCalled();
      expect(done).toHaveBeenCalledWith(null, {
        id: 'user-id',
        name: 'Test User',
        email: 'user@example.com',
        token: 'jwt_token_here',
      });
    });

    it('should handle oauthLogin error', async () => {
      (microsoftOAuth.exchangeCodeForToken as jest.Mock).mockResolvedValue({
        access_token: 'access-token',
        token_type: 'Bearer',
        expires_in: 3600,
      });
      (microsoftOAuth.getUserInfo as jest.Mock).mockResolvedValue({
        id: 'user-id',
        displayName: 'Test User',
        mail: 'user@example.com',
      });
      (oauthLogin as jest.Mock).mockResolvedValue(new Error('Login failed'));

      const req = { query: { code: 'test_code' } } as any;
      const done = jest.fn();

      await mockStrategyCallback(req, done);

      expect(done).toHaveBeenCalledWith(expect.any(Error), null);
    });

    it('should use userPrincipalName when mail is not available', async () => {
      (microsoftOAuth.exchangeCodeForToken as jest.Mock).mockResolvedValue({
        access_token: 'access-token',
        token_type: 'Bearer',
        expires_in: 3600,
      });
      (microsoftOAuth.getUserInfo as jest.Mock).mockResolvedValue({
        id: 'user-id',
        userPrincipalName: 'user@company.com',
        displayName: 'Test User',
      });
      (oauthLogin as jest.Mock).mockResolvedValue('jwt_token');
      (jwt.verify as jest.Mock).mockReturnValue({ id: 1 });

      const req = { query: { code: 'test_code' } } as any;
      const done = jest.fn();

      await mockStrategyCallback(req, done);

      expect(oauthLogin).toHaveBeenCalledWith(
        'microsoft',
        'user-id',
        'user@company.com',
        'Test User'
      );
      expect(done).toHaveBeenCalledWith(
        null,
        expect.objectContaining({
          email: 'user@company.com',
        })
      );
    });
  });

  describe('microsoft-subscribe strategy', () => {
    beforeEach(() => {
      initializeMicrosoftPassport();
      // Get the subscribe strategy callback (second call to MockCustomStrategy)
      mockStrategyCallback = MockCustomStrategy.mock.calls[1][0];
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

    it('should successfully authenticate user for subscription', async () => {
      (getCurrentUser as jest.Mock).mockResolvedValue({
        id: 1,
        email: 'test@example.com',
      });
      (microsoftOAuth.exchangeCodeForToken as jest.Mock).mockResolvedValue({
        access_token: 'access-token',
        token_type: 'Bearer',
        expires_in: 3600,
        refresh_token: 'refresh-token',
        scope: 'openid email profile User.Read offline_access',
      });
      (microsoftOAuth.getUserInfo as jest.Mock).mockResolvedValue({
        id: 'user-id',
        userPrincipalName: 'user@example.com',
        displayName: 'Test User',
        mail: 'user@example.com',
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

      expect(microsoftOAuth.exchangeCodeForToken).toHaveBeenCalledWith(
        'test_code'
      );
      expect(microsoftOAuth.getUserInfo).toHaveBeenCalledWith('access-token');
      expect(connectOAuthProvider).toHaveBeenCalledWith(
        1,
        'microsoft',
        'user-id',
        'user@example.com',
        'Test User'
      );
      expect(microsoftOAuth.storeUserToken).toHaveBeenCalled();
      expect(done).toHaveBeenCalledWith(null, {
        id: 'user-id',
        name: 'Test User',
        email: 'user@example.com',
        token: 'jwt_token_here',
      });
    });

    it('should handle connectOAuthProvider error', async () => {
      (getCurrentUser as jest.Mock).mockResolvedValue({
        id: 1,
        email: 'test@example.com',
      });
      (microsoftOAuth.exchangeCodeForToken as jest.Mock).mockResolvedValue({
        access_token: 'access-token',
        token_type: 'Bearer',
        expires_in: 3600,
      });
      (microsoftOAuth.getUserInfo as jest.Mock).mockResolvedValue({
        id: 'user-id',
        displayName: 'Test User',
        mail: 'user@example.com',
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
      (microsoftOAuth.exchangeCodeForToken as jest.Mock).mockResolvedValue({
        access_token: 'access-token',
        token_type: 'Bearer',
        expires_in: 3600,
      });
      (microsoftOAuth.getUserInfo as jest.Mock).mockResolvedValue({
        id: 'user-id',
        displayName: 'Test User',
        mail: 'user@example.com',
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
          id: 'user-id',
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
  });
});

// Mock jwt
jest.mock('jsonwebtoken', () => ({
  verify: jest.fn(),
}));

// Mock auth service
jest.mock('../../../src/routes/auth/auth.service', () => ({
  oauthLogin: jest.fn(),
  connectOAuthProvider: jest.fn(),
}));

// Mock utils auth
jest.mock('../../../src/utils/auth', () => ({
  getCurrentUser: jest.fn(),
}));

// Mock service subscription manager
jest.mock('../../../src/services/ServiceSubscriptionManager', () => ({
  serviceSubscriptionManager: {
    subscribeUser: jest.fn(),
  },
}));

// Mock passport with proper methods
jest.mock('passport', () => ({
  initialize: jest.fn(() => (req: any, res: any, next: any) => next()),
  session: jest.fn(() => (req: any, res: any, next: any) => next()),
  use: jest.fn(),
}));

describe('Microsoft Passport', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('initializeMicrosoftPassport', () => {
    it('should initialize passport strategies', () => {
      const passport = require('passport');
      const { Strategy: CustomStrategy } = require('passport-custom');

      const {
        initializeMicrosoftPassport,
      } = require('../../../src/services/services/microsoft/passport');

      initializeMicrosoftPassport();

      expect(passport.use).toHaveBeenCalledTimes(2);
      expect(passport.use).toHaveBeenCalledWith('microsoft-login', {});
      expect(passport.use).toHaveBeenCalledWith('microsoft-subscribe', {});
    });
  });
});
