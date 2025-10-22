import { jest } from '@jest/globals';

// Mock passport-github
jest.mock('passport-github', () => ({
  Strategy: jest.fn().mockImplementation((options, verify) => {
    return {
      _verify: verify,
    };
  }),
}));

// Mock JWT
jest.mock('jsonwebtoken', () => ({
  verify: jest.fn(),
  sign: jest.fn(),
}));

// Mock auth service
jest.mock('../../../src/routes/auth/auth.service', () => ({
  oauthLogin: jest.fn(),
  connectOAuthProvider: jest.fn(),
}));

// Mock utils
jest.mock('../../../src/utils/auth', () => ({
  getCurrentUser: jest.fn(),
}));

// Mock service subscription manager
jest.mock('../../../src/services/ServiceSubscriptionManager', () => ({
  serviceSubscriptionManager: {
    subscribeUser: jest.fn(),
  },
}));

// Mock the oauth module
jest.mock('../../../src/services/services/github/oauth', () => ({
  githubOAuth: {
    storeUserToken: jest.fn(),
    getUserEmails: jest.fn(),
  },
}));

// Mock JWT_SECRET
jest.mock('../../../index', () => ({
  JWT_SECRET: 'test-jwt-secret',
}));

describe('GitHub Passport Strategies', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    process.env.SERVICE_GITHUB_CLIENT_ID = 'test-client-id';
    process.env.SERVICE_GITHUB_CLIENT_SECRET = 'test-client-secret';
    process.env.SERVICE_GITHUB_REDIRECT_URI =
      'http://localhost:8080/auth/github/callback';
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('initializeGitHubPassport', () => {
    it('should initialize GitHub passport strategies', () => {
      const {
        initializeGitHubPassport,
      } = require('../../../src/services/services/github/passport');

      initializeGitHubPassport();

      const { Strategy } = require('passport-github');

      expect(Strategy).toHaveBeenCalledTimes(2);

      // Check github-login strategy
      expect(Strategy).toHaveBeenNthCalledWith(
        1,
        {
          clientID: 'test-client-id',
          clientSecret: 'test-client-secret',
          callbackURL: 'http://localhost:8080/auth/github/callback',
          scope: ['user:email'],
          passReqToCallback: true,
        },
        expect.any(Function)
      );

      // Check github-subscribe strategy
      expect(Strategy).toHaveBeenNthCalledWith(
        2,
        {
          clientID: 'test-client-id',
          clientSecret: 'test-client-secret',
          callbackURL: 'http://localhost:8080/auth/github/callback',
          scope: ['user:email', 'repo'],
          passReqToCallback: true,
        },
        expect.any(Function)
      );
    });
  });

  describe('github-login strategy', () => {
    it('should handle successful login', async () => {
      const {
        initializeGitHubPassport,
      } = require('../../../src/services/services/github/passport');
      const { oauthLogin } = require('../../../src/routes/auth/auth.service');
      const {
        githubOAuth,
      } = require('../../../src/services/services/github/oauth');
      const jwt = require('jsonwebtoken');

      initializeGitHubPassport();

      const { Strategy } = require('passport-github');
      const loginStrategy = (Strategy as any).mock.results[0].value;
      const verifyCallback = loginStrategy._verify;

      const mockReq = {};
      const mockAccessToken = 'test-access-token';
      const mockRefreshToken = 'test-refresh-token';
      const mockProfile = {
        id: '12345',
        displayName: 'Test User',
        username: 'testuser',
        emails: [{ value: 'test@example.com' }],
      };
      const mockDone = jest.fn();

      const mockUserToken = 'jwt-token-123';
      (oauthLogin as any).mockResolvedValue(mockUserToken);
      (jwt.verify as any).mockReturnValue({ id: 1 });
      (githubOAuth.getUserEmails as any).mockResolvedValue([]);

      await verifyCallback(
        mockReq,
        mockAccessToken,
        {},
        mockRefreshToken,
        mockProfile,
        mockDone
      );

      expect(oauthLogin).toHaveBeenCalledWith(
        'github',
        '12345',
        'test@example.com',
        'Test User'
      );
      expect(githubOAuth.storeUserToken).toHaveBeenCalledWith(1, {
        access_token: 'test-access-token',
        token_type: 'bearer',
        scope: 'user:email',
      });
      expect(mockDone).toHaveBeenCalledWith(null, {
        id: '12345',
        name: 'Test User',
        email: 'test@example.com',
        token: 'jwt-token-123',
      });
    });

    it('should fetch primary email when profile email is oauth email', async () => {
      const {
        initializeGitHubPassport,
      } = require('../../../src/services/services/github/passport');
      const { oauthLogin } = require('../../../src/routes/auth/auth.service');
      const {
        githubOAuth,
      } = require('../../../src/services/services/github/oauth');
      const jwt = require('jsonwebtoken');

      initializeGitHubPassport();

      const { Strategy } = require('passport-github');
      const loginStrategy = (Strategy as any).mock.results[0].value;
      const verifyCallback = loginStrategy._verify;

      const mockReq = {};
      const mockAccessToken = 'test-access-token';
      const mockProfile = {
        id: '12345',
        displayName: 'Test User',
        username: 'testuser',
        emails: [{ value: 'test@github.oauth' }],
      };
      const mockDone = jest.fn();

      const mockUserToken = 'jwt-token-123';
      (oauthLogin as any).mockResolvedValue(mockUserToken);
      (jwt.verify as any).mockReturnValue({ id: 1 });
      (githubOAuth.getUserEmails as any).mockResolvedValue([
        {
          email: 'primary@example.com',
          verified: true,
          primary: true,
        },
      ]);

      await verifyCallback(
        mockReq,
        mockAccessToken,
        {},
        'refresh',
        mockProfile,
        mockDone
      );

      expect(githubOAuth.getUserEmails).toHaveBeenCalledWith(
        'test-access-token'
      );
      expect(oauthLogin).toHaveBeenCalledWith(
        'github',
        '12345',
        'primary@example.com',
        'Test User'
      );
    });

    it('should handle oauth login error', async () => {
      const {
        initializeGitHubPassport,
      } = require('../../../src/services/services/github/passport');
      const { oauthLogin } = require('../../../src/routes/auth/auth.service');

      initializeGitHubPassport();

      const { Strategy } = require('passport-github');
      const loginStrategy = (Strategy as any).mock.results[0].value;
      const verifyCallback = loginStrategy._verify;

      const mockReq = {};
      const mockProfile = {
        id: '12345',
        displayName: 'Test User',
        emails: [{ value: 'test@example.com' }],
      };
      const mockDone = jest.fn();

      const mockError = new Error('Login failed');
      (oauthLogin as any).mockResolvedValue(mockError);

      await verifyCallback(
        mockReq,
        'token',
        {},
        'refresh',
        mockProfile,
        mockDone
      );

      expect(mockDone).toHaveBeenCalledWith(mockError, null);
    });
  });

  describe('github-subscribe strategy', () => {
    it('should handle successful subscription', async () => {
      const {
        initializeGitHubPassport,
      } = require('../../../src/services/services/github/passport');
      const {
        connectOAuthProvider,
      } = require('../../../src/routes/auth/auth.service');
      const { getCurrentUser } = require('../../../src/utils/auth');
      const {
        githubOAuth,
      } = require('../../../src/services/services/github/oauth');
      const jwt = require('jsonwebtoken');
      const {
        serviceSubscriptionManager,
      } = require('../../../src/services/ServiceSubscriptionManager');

      initializeGitHubPassport();

      const { Strategy } = require('passport-github');
      const subscribeStrategy = (Strategy as any).mock.results[1].value;
      const verifyCallback = subscribeStrategy._verify;

      const mockReq = {};
      const mockAccessToken = 'test-access-token';
      const mockProfile = {
        id: '12345',
        displayName: 'Test User',
        username: 'testuser',
        emails: [{ value: 'test@example.com' }],
      };
      const mockDone = jest.fn();

      const mockCurrentUser = { id: 1 };
      const mockUserToken = 'jwt-token-123';

      (getCurrentUser as any).mockResolvedValue(mockCurrentUser);
      (connectOAuthProvider as any).mockResolvedValue(mockUserToken);
      (jwt.verify as any).mockReturnValue({ id: 1 });
      (githubOAuth.getUserEmails as any).mockResolvedValue([]);
      (serviceSubscriptionManager.subscribeUser as any).mockResolvedValue(
        undefined
      );

      await verifyCallback(
        mockReq,
        mockAccessToken,
        {},
        'refresh',
        mockProfile,
        mockDone
      );

      expect(getCurrentUser).toHaveBeenCalledWith(mockReq);
      expect(connectOAuthProvider).toHaveBeenCalledWith(
        1,
        'github',
        '12345',
        'test@example.com',
        'Test User'
      );
      expect(githubOAuth.storeUserToken).toHaveBeenCalledWith(1, {
        access_token: 'test-access-token',
        token_type: 'bearer',
        scope: 'user:email,repo',
      });
      expect(serviceSubscriptionManager.subscribeUser).toHaveBeenCalledWith(
        1,
        'github'
      );
      expect(mockDone).toHaveBeenCalledWith(null, {
        id: '12345',
        name: 'Test User',
        email: 'test@example.com',
        token: 'jwt-token-123',
      });
    });

    it('should handle when user is not authenticated', async () => {
      const {
        initializeGitHubPassport,
      } = require('../../../src/services/services/github/passport');
      const { getCurrentUser } = require('../../../src/utils/auth');

      initializeGitHubPassport();

      const { Strategy } = require('passport-github');
      const subscribeStrategy = (Strategy as any).mock.results[1].value;
      const verifyCallback = subscribeStrategy._verify;

      const mockReq = {};
      const mockProfile = {
        id: '12345',
        displayName: 'Test User',
        emails: [{ value: 'test@example.com' }],
      };
      const mockDone = jest.fn();

      (getCurrentUser as any).mockResolvedValue(null);

      await verifyCallback(
        mockReq,
        'token',
        {},
        'refresh',
        mockProfile,
        mockDone
      );

      expect(mockDone).toHaveBeenCalledWith(
        new Error('User not authenticated'),
        null
      );
    });

    it('should handle subscription error', async () => {
      const {
        initializeGitHubPassport,
      } = require('../../../src/services/services/github/passport');
      const {
        connectOAuthProvider,
      } = require('../../../src/routes/auth/auth.service');
      const { getCurrentUser } = require('../../../src/utils/auth');

      initializeGitHubPassport();

      const { Strategy } = require('passport-github');
      const subscribeStrategy = (Strategy as any).mock.results[1].value;
      const verifyCallback = subscribeStrategy._verify;

      const mockReq = {};
      const mockProfile = {
        id: '12345',
        displayName: 'Test User',
        emails: [{ value: 'test@example.com' }],
      };
      const mockDone = jest.fn();

      const mockCurrentUser = { id: 1 };
      const mockError = new Error('Subscription failed');

      (getCurrentUser as any).mockResolvedValue(mockCurrentUser);
      (connectOAuthProvider as any).mockResolvedValue(mockError);

      await verifyCallback(
        mockReq,
        'token',
        {},
        'refresh',
        mockProfile,
        mockDone
      );

      expect(mockDone).toHaveBeenCalledWith(mockError, null);
    });
  });
});
