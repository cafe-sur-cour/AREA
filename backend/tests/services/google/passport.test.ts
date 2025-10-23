// Mock node-fetch before importing oauth.ts to avoid ESM issues
const mockFetch = jest.fn() as jest.MockedFunction<typeof fetch>;
jest.mock('node-fetch', () => mockFetch);
global.fetch = mockFetch;

// Mock passport-google-oauth20 before importing
jest.mock('passport-google-oauth20', () => ({
  Strategy: jest.fn().mockImplementation((options, callback) => {
    const strategy = {
      name: 'google',
      authenticate: jest.fn(),
      _oauth2: {
        getOAuthAccessToken: jest.fn(),
        get: jest.fn(),
      },
      _verify: callback, // Store the callback
    };
    return strategy;
  }),
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

jest.mock('../../../src/services/services/google/oauth', () => ({
  googleOAuth: {
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
import { googleOAuth } from '../../../src/services/services/google/oauth';
import jwt from 'jsonwebtoken';

describe('Google Passport Strategy', () => {
  let loginStrategyCallback: any;
  let subscribeStrategyCallback: any;

  beforeEach(async () => {
    jest.clearAllMocks();

    // Reset callbacks
    loginStrategyCallback = null;
    subscribeStrategyCallback = null;

    const module = await import(
      '../../../src/services/services/google/passport'
    );
    module.initializeGooglePassport();

    // Capture the strategy callbacks from passport.use calls
    const passport = require('passport');
    const loginCall = passport.use.mock.calls.find(
      (call: any) => call[0] === 'google-login'
    );
    const subscribeCall = passport.use.mock.calls.find(
      (call: any) => call[0] === 'google-subscribe'
    );

    if (loginCall && loginCall[1] && loginCall[1]._verify) {
      loginStrategyCallback = loginCall[1]._verify;
    }
    if (subscribeCall && subscribeCall[1] && subscribeCall[1]._verify) {
      subscribeStrategyCallback = subscribeCall[1]._verify;
    }
  });

  describe('google-login strategy', () => {
    it('should successfully authenticate user for login', async () => {
      (googleOAuth.storeUserToken as jest.Mock).mockResolvedValue(undefined);
      (oauthLogin as jest.Mock).mockResolvedValue('jwt_token_here');
      (jwt.verify as jest.Mock).mockReturnValue({ id: 1 });

      const req = {} as any;
      const accessToken = 'access-token';
      const refreshToken = 'refresh-token';
      const params = { expires_in: 3600 };
      const profile = {
        id: 'user-id',
        emails: [{ value: 'user@example.com' }],
        displayName: 'Test User',
        name: { givenName: 'Test', familyName: 'User' },
      };
      const done = jest.fn();

      await loginStrategyCallback(
        req,
        accessToken,
        refreshToken,
        params,
        profile,
        done
      );

      expect(oauthLogin).toHaveBeenCalledWith(
        'google',
        'user-id',
        'user@example.com',
        'Test User'
      );
      expect(googleOAuth.storeUserToken).toHaveBeenCalled();
      expect(done).toHaveBeenCalledWith(null, {
        id: 'user-id',
        name: 'Test User',
        email: 'user@example.com',
        token: 'jwt_token_here',
      });
    });

    it('should handle oauthLogin error', async () => {
      (googleOAuth.storeUserToken as jest.Mock).mockResolvedValue(undefined);
      (oauthLogin as jest.Mock).mockResolvedValue(new Error('Login failed'));

      const req = {} as any;
      const accessToken = 'access-token';
      const refreshToken = 'refresh-token';
      const params = { expires_in: 3600 };
      const profile = {
        id: 'user-id',
        emails: [{ value: 'user@example.com' }],
        displayName: 'Test User',
      };
      const done = jest.fn();

      await loginStrategyCallback(
        req,
        accessToken,
        refreshToken,
        params,
        profile,
        done
      );

      expect(done).toHaveBeenCalledWith(expect.any(Error), null);
    });

    it('should handle missing email gracefully', async () => {
      (googleOAuth.storeUserToken as jest.Mock).mockResolvedValue(undefined);
      (oauthLogin as jest.Mock).mockResolvedValue('jwt_token');
      (jwt.verify as jest.Mock).mockReturnValue({ id: 1 });

      const req = {} as any;
      const accessToken = 'access-token';
      const refreshToken = 'refresh-token';
      const params = { expires_in: 3600 };
      const profile = {
        id: 'user-id',
        displayName: 'Test User',
        name: { givenName: 'Test', familyName: 'User' },
      };
      const done = jest.fn();

      await loginStrategyCallback(
        req,
        accessToken,
        refreshToken,
        params,
        profile,
        done
      );

      expect(oauthLogin).toHaveBeenCalledWith(
        'google',
        'user-id',
        '',
        'Test User'
      );
      expect(done).toHaveBeenCalledWith(null, {
        id: 'user-id',
        name: 'Test User',
        email: '',
        token: 'jwt_token',
      });
    });

    it('should construct display name from given and family name when displayName is missing', async () => {
      (googleOAuth.storeUserToken as jest.Mock).mockResolvedValue(undefined);
      (oauthLogin as jest.Mock).mockResolvedValue('jwt_token');
      (jwt.verify as jest.Mock).mockReturnValue({ id: 1 });

      const req = {} as any;
      const accessToken = 'access-token';
      const refreshToken = 'refresh-token';
      const params = { expires_in: 3600 };
      const profile = {
        id: 'user-id',
        emails: [{ value: 'user@example.com' }],
        name: { givenName: 'Test', familyName: 'User' },
      };
      const done = jest.fn();

      await loginStrategyCallback(
        req,
        accessToken,
        refreshToken,
        params,
        profile,
        done
      );

      expect(oauthLogin).toHaveBeenCalledWith(
        'google',
        'user-id',
        'user@example.com',
        'Test User'
      );
      expect(done).toHaveBeenCalledWith(null, {
        id: 'user-id',
        name: 'Test User',
        email: 'user@example.com',
        token: 'jwt_token',
      });
    });
  });

  describe('google-subscribe strategy', () => {
    it('should return error when user not authenticated', async () => {
      (getCurrentUser as jest.Mock).mockResolvedValue(null);

      const req = {} as any;
      const accessToken = 'access-token';
      const refreshToken = 'refresh-token';
      const params = { expires_in: 3600 };
      const profile = {
        id: 'user-id',
        emails: [{ value: 'user@example.com' }],
        displayName: 'Test User',
      };
      const done = jest.fn();

      await subscribeStrategyCallback(
        req,
        accessToken,
        refreshToken,
        params,
        profile,
        done
      );

      expect(done).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'User not authenticated' }),
        null
      );
    });

    it('should successfully authenticate user for subscription', async () => {
      (getCurrentUser as jest.Mock).mockResolvedValue({
        id: 1,
        email: 'test@example.com',
      });
      (googleOAuth.storeUserToken as jest.Mock).mockResolvedValue(undefined);
      (connectOAuthProvider as jest.Mock).mockResolvedValue('jwt_token_here');
      (jwt.verify as jest.Mock).mockReturnValue({ id: 1 });

      const { serviceSubscriptionManager } = await import(
        '../../../src/services/ServiceSubscriptionManager'
      );
      (serviceSubscriptionManager.subscribeUser as jest.Mock).mockResolvedValue(
        undefined
      );

      const req = {} as any;
      const accessToken = 'access-token';
      const refreshToken = 'refresh-token';
      const params = { expires_in: 3600 };
      const profile = {
        id: 'user-id',
        emails: [{ value: 'user@example.com' }],
        displayName: 'Test User',
        name: { givenName: 'Test', familyName: 'User' },
      };
      const done = jest.fn();

      await subscribeStrategyCallback(
        req,
        accessToken,
        refreshToken,
        params,
        profile,
        done
      );

      expect(connectOAuthProvider).toHaveBeenCalledWith(
        1,
        'google',
        'user-id',
        'user@example.com',
        'Test User'
      );
      expect(googleOAuth.storeUserToken).toHaveBeenCalled();
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
      (googleOAuth.storeUserToken as jest.Mock).mockResolvedValue(undefined);
      (connectOAuthProvider as jest.Mock).mockResolvedValue(
        new Error('Connection failed')
      );

      const req = {} as any;
      const accessToken = 'access-token';
      const refreshToken = 'refresh-token';
      const params = { expires_in: 3600 };
      const profile = {
        id: 'user-id',
        emails: [{ value: 'user@example.com' }],
        displayName: 'Test User',
      };
      const done = jest.fn();

      await subscribeStrategyCallback(
        req,
        accessToken,
        refreshToken,
        params,
        profile,
        done
      );

      expect(done).toHaveBeenCalledWith(expect.any(Error), null);
    });

    it('should handle subscription error gracefully', async () => {
      (getCurrentUser as jest.Mock).mockResolvedValue({
        id: 1,
        email: 'test@example.com',
      });
      (googleOAuth.storeUserToken as jest.Mock).mockResolvedValue(undefined);
      (connectOAuthProvider as jest.Mock).mockResolvedValue('jwt_token');
      (jwt.verify as jest.Mock).mockReturnValue({ id: 1 });

      const { serviceSubscriptionManager } = await import(
        '../../../src/services/ServiceSubscriptionManager'
      );
      (serviceSubscriptionManager.subscribeUser as jest.Mock).mockRejectedValue(
        new Error('Subscription failed')
      );

      const req = {} as any;
      const accessToken = 'access-token';
      const refreshToken = 'refresh-token';
      const params = { expires_in: 3600 };
      const profile = {
        id: 'user-id',
        emails: [{ value: 'user@example.com' }],
        displayName: 'Test User',
      };
      const done = jest.fn();

      await subscribeStrategyCallback(
        req,
        accessToken,
        refreshToken,
        params,
        profile,
        done
      );

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

      const req = {} as any;
      const accessToken = 'access-token';
      const refreshToken = 'refresh-token';
      const params = { expires_in: 3600 };
      const profile = {
        id: 'user-id',
        emails: [{ value: 'user@example.com' }],
        displayName: 'Test User',
      };
      const done = jest.fn();

      await subscribeStrategyCallback(
        req,
        accessToken,
        refreshToken,
        params,
        profile,
        done
      );

      expect(done).toHaveBeenCalledWith(expect.any(Error), null);
    });
  });
});
