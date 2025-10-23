import { jest } from '@jest/globals';

// Mock passport-gitlab
jest.mock('passport-gitlab2', () => ({
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
jest.mock('../../../src/services/services/gitlab/oauth', () => ({
  gitlabOAuth: {
    storeUserToken: jest.fn(),
    getUserEmails: jest.fn(),
  },
}));

// Mock JWT_SECRET
jest.mock('../../../index', () => ({
  JWT_SECRET: 'test-jwt-secret',
}));

describe('GitLab Passport Strategies', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    process.env.SERVICE_GITLAB_CLIENT_ID = 'test-client-id';
    process.env.SERVICE_GITLAB_CLIENT_SECRET = 'test-client-secret';
    process.env.SERVICE_GITLAB_REDIRECT_URI =
      'http://localhost:8080/auth/gitlab/callback';
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('initializeGitLabPassport', () => {
    it('should initialize GitLab passport subscribe strategy', () => {
      const {
        initializeGitLabPassport,
      } = require('../../../src/services/services/gitlab/passport');

      // Clear all previous passport.use calls
      jest.clearAllMocks();

      initializeGitLabPassport();

      const { Strategy } = require('passport-gitlab2');

      // Only the subscribe strategy should be initialized
      expect(Strategy).toHaveBeenCalledWith(
        {
          clientID: 'test-client-id',
          clientSecret: 'test-client-secret',
          callbackURL: 'http://localhost:8080/auth/gitlab/callback',
          baseURL: 'https://gitlab.com',
          scope:
            'api read_user read_api read_repository write_repository read_registry write_registry',
          passReqToCallback: true,
        },
        expect.any(Function)
      );
    });
  });

  describe('gitlab-subscribe strategy', () => {
    it('should handle successful subscription', async () => {
      const { connectOAuthProvider } = require(
        '../../../src/routes/auth/auth.service'
      );
      const { getCurrentUser } = require('../../../src/utils/auth');
      const { gitlabOAuth } = require(
        '../../../src/services/services/gitlab/oauth'
      );
      const { verify } = require('jsonwebtoken');
      const { serviceSubscriptionManager } = require(
        '../../../src/services/ServiceSubscriptionManager'
      );

      getCurrentUser.mockResolvedValue({ id: 123 });
      connectOAuthProvider.mockResolvedValue('jwt-token');
      verify.mockReturnValue({ id: 123 });
      gitlabOAuth.storeUserToken.mockResolvedValue(undefined);
      serviceSubscriptionManager.subscribeUser.mockResolvedValue(undefined);

      const {
        initializeGitLabPassport,
      } = require('../../../src/services/services/gitlab/passport');

      initializeGitLabPassport();

      const { Strategy } = require('passport-gitlab2');
      // Since there's only the subscribe strategy, use index 0
      const verifyCallback = Strategy.mock.calls[0][1];

      const mockReq = {};
      const mockProfile = {
        id: 'gitlab-user-id',
        displayName: 'Test User',
        username: 'testuser',
        emails: [{ value: 'test@example.com' }],
      };

      await new Promise((resolve) => {
        verifyCallback(
          mockReq,
          'access-token',
          'refresh-token',
          mockProfile,
          (error: any, user: any) => {
            expect(error).toBeNull();
            expect(user).toEqual({
              id: 'gitlab-user-id',
              name: 'Test User',
              email: 'test@example.com',
              token: 'jwt-token',
            });
            resolve(null);
          }
        );
      });

      expect(getCurrentUser).toHaveBeenCalledWith(mockReq);
      expect(connectOAuthProvider).toHaveBeenCalled();
      expect(serviceSubscriptionManager.subscribeUser).toHaveBeenCalledWith(
        123,
        'gitlab'
      );
    });

    it('should handle unauthenticated user', async () => {
      const { getCurrentUser } = require('../../../src/utils/auth');

      getCurrentUser.mockResolvedValue(null);

      const {
        initializeGitLabPassport,
      } = require('../../../src/services/services/gitlab/passport');

      initializeGitLabPassport();

      const { Strategy } = require('passport-gitlab2');
      // Since there's only the subscribe strategy, use index 0
      const verifyCallback = Strategy.mock.calls[0][1];

      const mockReq = {};
      const mockProfile = {
        id: 'gitlab-user-id',
        displayName: 'Test User',
      };

      await new Promise((resolve) => {
        verifyCallback(
          mockReq,
          'access-token',
          'refresh-token',
          mockProfile,
          (error: any, user: any) => {
            expect(error).toEqual(new Error('User not authenticated'));
            expect(user).toBeNull();
            resolve(null);
          }
        );
      });
    });

    it('should store token data for authenticated user', async () => {
      const { connectOAuthProvider } = require(
        '../../../src/routes/auth/auth.service'
      );
      const { getCurrentUser } = require('../../../src/utils/auth');
      const { gitlabOAuth } = require(
        '../../../src/services/services/gitlab/oauth'
      );
      const { verify } = require('jsonwebtoken');

      getCurrentUser.mockResolvedValue({ id: 123 });
      connectOAuthProvider.mockResolvedValue('jwt-token');
      verify.mockReturnValue({ id: 456 });
      gitlabOAuth.storeUserToken.mockResolvedValue(undefined);

      const {
        initializeGitLabPassport,
      } = require('../../../src/services/services/gitlab/passport');

      initializeGitLabPassport();

      const { Strategy } = require('passport-gitlab2');
      const verifyCallback = Strategy.mock.calls[0][1];

      const mockReq = {};
      const mockProfile = {
        id: 'gitlab-user-id',
        displayName: 'Test User',
        username: 'testuser',
        emails: [{ value: 'test@example.com' }],
      };

      await new Promise((resolve) => {
        verifyCallback(
          mockReq,
          'test-access-token',
          'test-refresh-token',
          mockProfile,
          (error: any, user: any) => {
            expect(error).toBeNull();
            resolve(null);
          }
        );
      });

      expect(gitlabOAuth.storeUserToken).toHaveBeenCalledWith(
        456,
        expect.objectContaining({
          access_token: 'test-access-token',
          token_type: 'bearer',
          scope: 'read_user api write_repository',
        })
      );
    });

    it('should handle connectOAuthProvider errors', async () => {
      const { connectOAuthProvider } = require(
        '../../../src/routes/auth/auth.service'
      );
      const { getCurrentUser } = require('../../../src/utils/auth');

      const testError = new Error('Failed to connect provider');
      getCurrentUser.mockResolvedValue({ id: 123 });
      connectOAuthProvider.mockResolvedValue(testError);

      const {
        initializeGitLabPassport,
      } = require('../../../src/services/services/gitlab/passport');

      initializeGitLabPassport();

      const { Strategy } = require('passport-gitlab2');
      const verifyCallback = Strategy.mock.calls[0][1];

      const mockReq = {};
      const mockProfile = {
        id: 'gitlab-user-id',
        displayName: 'Test User',
        emails: [{ value: 'test@example.com' }],
      };

      await new Promise((resolve) => {
        verifyCallback(
          mockReq,
          'access-token',
          'refresh-token',
          mockProfile,
          (error: any, user: any) => {
            expect(error).toEqual(testError);
            expect(user).toBeNull();
            resolve(null);
          }
        );
      });
    });

    it('should handle catch block errors', async () => {
      const { getCurrentUser } = require('../../../src/utils/auth');

      const testError = new Error('Unexpected error');
      getCurrentUser.mockRejectedValue(testError);

      const {
        initializeGitLabPassport,
      } = require('../../../src/services/services/gitlab/passport');

      initializeGitLabPassport();

      const { Strategy } = require('passport-gitlab2');
      const verifyCallback = Strategy.mock.calls[0][1];

      const mockReq = {};
      const mockProfile = {
        id: 'gitlab-user-id',
        displayName: 'Test User',
      };

      await new Promise((resolve) => {
        verifyCallback(
          mockReq,
          'access-token',
          'refresh-token',
          mockProfile,
          (error: any, user: any) => {
            expect(error).toEqual(testError);
            expect(user).toBeNull();
            resolve(null);
          }
        );
      });
    });
  });
});
