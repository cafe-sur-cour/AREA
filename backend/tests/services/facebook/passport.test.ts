import { jest } from '@jest/globals';

// Mock passport-facebook
jest.mock('passport-facebook', () => ({
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
}));

// Mock oauth module
jest.mock('../../../src/services/services/facebook/oauth', () => ({
  facebookOAuth: {
    storeUserToken: jest.fn(),
  },
}));

// Mock JWT_SECRET
jest.mock('../../../index', () => ({
  JWT_SECRET: 'test-jwt-secret',
}));

describe('Facebook Passport Strategy', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    process.env.SERVICE_FACEBOOK_CLIENT_ID = 'test-client-id';
    process.env.SERVICE_FACEBOOK_CLIENT_SECRET = 'test-client-secret';
    process.env.SERVICE_FACEBOOK_REDIRECT_URI =
      'http://localhost:8080/auth/facebook/callback';
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('initializeFacebookPassport', () => {
    it('should initialize Facebook passport strategy', () => {
      const {
        initializeFacebookPassport,
      } = require('../../../src/services/services/facebook/passport');

      initializeFacebookPassport();

      const { Strategy } = require('passport-facebook');

      expect(Strategy).toHaveBeenCalledTimes(1);
      expect(Strategy).toHaveBeenCalledWith(
        {
          clientID: 'test-client-id',
          clientSecret: 'test-client-secret',
          callbackURL: 'http://localhost:8080/auth/facebook/callback',
          profileFields: ['id', 'displayName', 'email', 'picture.type(large)'],
          passReqToCallback: true,
        },
        expect.any(Function)
      );
    });
  });

  describe('facebook-login strategy', () => {
    it('should handle successful login', async () => {
      const {
        initializeFacebookPassport,
      } = require('../../../src/services/services/facebook/passport');
      const { oauthLogin } = require('../../../src/routes/auth/auth.service');
      const {
        facebookOAuth,
      } = require('../../../src/services/services/facebook/oauth');
      const jwt = require('jsonwebtoken');

      initializeFacebookPassport();

      const { Strategy } = require('passport-facebook');
      const strategy = (Strategy as any).mock.results[0].value;
      const verifyCallback = strategy._verify;

      const mockReq = {};
      const mockAccessToken = 'test-access-token';
      const mockRefreshToken = 'test-refresh-token';
      const mockProfile = {
        id: '12345',
        displayName: 'Test User',
        emails: [{ value: 'test@example.com' }],
      };
      const mockDone = jest.fn();

      const mockUserToken = 'jwt-token-123';
      (oauthLogin as any).mockResolvedValue(mockUserToken);
      (jwt.verify as any).mockReturnValue({ id: 1 });

      await verifyCallback(
        mockReq,
        mockAccessToken,
        {},
        mockRefreshToken,
        mockProfile,
        mockDone
      );

      expect(oauthLogin).toHaveBeenCalledWith(
        'meta',
        '12345',
        'test@example.com',
        'Test User'
      );
      expect(facebookOAuth.storeUserToken).toHaveBeenCalledWith(1, {
        access_token: 'test-access-token',
        token_type: 'bearer',
        expires_in: 5184000,
      });
      expect(mockDone).toHaveBeenCalledWith(null, {
        id: '12345',
        name: 'Test User',
        email: 'test@example.com',
        token: 'jwt-token-123',
      });
    });

    it('should handle user without email', async () => {
      const {
        initializeFacebookPassport,
      } = require('../../../src/services/services/facebook/passport');
      const { oauthLogin } = require('../../../src/routes/auth/auth.service');
      const {
        facebookOAuth,
      } = require('../../../src/services/services/facebook/oauth');
      const jwt = require('jsonwebtoken');

      initializeFacebookPassport();

      const { Strategy } = require('passport-facebook');
      const strategy = (Strategy as any).mock.results[0].value;
      const verifyCallback = strategy._verify;

      const mockReq = {};
      const mockAccessToken = 'test-access-token';
      const mockProfile = {
        id: '12345',
        displayName: 'Test User',
        emails: [], // No emails
      };
      const mockDone = jest.fn();

      const mockUserToken = 'jwt-token-123';
      (oauthLogin as any).mockResolvedValue(mockUserToken);
      (jwt.verify as any).mockReturnValue({ id: 1 });

      await verifyCallback(
        mockReq,
        mockAccessToken,
        {},
        'refresh',
        mockProfile,
        mockDone
      );

      expect(oauthLogin).toHaveBeenCalledWith('meta', '12345', '', 'Test User');
      expect(facebookOAuth.storeUserToken).toHaveBeenCalledWith(1, {
        access_token: 'test-access-token',
        token_type: 'bearer',
        expires_in: 5184000,
      });
      expect(mockDone).toHaveBeenCalledWith(null, {
        id: '12345',
        name: 'Test User',
        email: undefined,
        token: 'jwt-token-123',
      });
    });

    it('should handle oauth login error', async () => {
      const {
        initializeFacebookPassport,
      } = require('../../../src/services/services/facebook/passport');
      const { oauthLogin } = require('../../../src/routes/auth/auth.service');

      initializeFacebookPassport();

      const { Strategy } = require('passport-facebook');
      const strategy = (Strategy as any).mock.results[0].value;
      const verifyCallback = strategy._verify;

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
});
