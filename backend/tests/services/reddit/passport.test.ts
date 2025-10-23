// Mock OAuth2Strategy before importing
let mockStrategyCallback: any;
const MockOAuth2Strategy = jest.fn((options, callback) => {
  mockStrategyCallback = callback;
  // Return an object with _oauth2 to prevent the error
  return {
    _oauth2: {
      getOAuthAccessToken: jest.fn(),
      _customHeaders: {},
    },
  };
});
jest.mock('passport-oauth2', () => ({
  Strategy: MockOAuth2Strategy,
}));

// Mock adminjs and related modules
jest.mock('adminjs', () => ({
  default: jest.fn(),
  ComponentLoader: jest.fn(),
}));

jest.mock('../../../src/config/adminJs', () => ({
  setupAdminPanel: jest.fn(),
}));

// Mock the entire index.ts
jest.mock('../../../index', () => ({
  JWT_SECRET: 'test-secret',
  encryption: {
    encrypt: jest.fn(data => `encrypted_${data}`),
    decrypt: jest.fn(data => data.replace('encrypted_', '')),
  },
}));

// Mock node-fetch before importing oauth.ts to avoid ESM issues
const mockFetch = jest.fn() as jest.MockedFunction<typeof fetch>;
jest.mock('node-fetch', () => mockFetch);
global.fetch = mockFetch;

// Set environment variables
process.env.SERVICE_REDDIT_CLIENT_ID = 'test-client-id';
process.env.SERVICE_REDDIT_CLIENT_SECRET = 'test-client-secret';
process.env.SERVICE_REDDIT_REDIRECT_URI = 'https://test.com/callback';
process.env.SERVICE_REDDIT_API_BASE_URL = 'https://www.reddit.com';

// Mock passport with proper methods
jest.mock('passport', () => ({
  initialize: jest.fn(() => (req: any, res: any, next: any) => next()),
  session: jest.fn(() => (req: any, res: any, next: any) => next()),
  use: jest.fn(),
  authenticate: jest.fn(),
  serializeUser: jest.fn(),
  deserializeUser: jest.fn(),
}));

jest.mock('../../../src/routes/auth/auth.service');
jest.mock('../../../src/services/services/reddit/oauth');
jest.mock('../../../src/utils/auth');
jest.mock('jsonwebtoken');

import passport from 'passport';
import { initializeRedditPassport } from '../../../src/services/services/reddit/passport';
import { connectOAuthProvider } from '../../../src/routes/auth/auth.service';
import { redditOAuth } from '../../../src/services/services/reddit/oauth';
import { getCurrentUser } from '../../../src/utils/auth';
import jwt from 'jsonwebtoken';

describe('Reddit Passport', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();

    process.env = {
      ...originalEnv,
      SERVICE_REDDIT_API_BASE_URL: 'https://www.reddit.com',
      SERVICE_REDDIT_CLIENT_ID: 'test-client-id',
      SERVICE_REDDIT_CLIENT_SECRET: 'test-client-secret',
      SERVICE_REDDIT_REDIRECT_URI: 'https://test.com/callback',
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('initializeRedditPassport', () => {
    it('should register the Reddit strategy', () => {
      initializeRedditPassport();

      expect(passport.use).toHaveBeenCalledWith(
        'reddit-subscribe',
        expect.any(Object)
      );
      expect(MockOAuth2Strategy).toHaveBeenCalledWith(
        expect.objectContaining({
          authorizationURL: expect.stringContaining('/api/v1/authorize'),
          tokenURL: expect.stringContaining('/api/v1/access_token'),
          clientID: 'test-client-id',
          clientSecret: 'test-client-secret',
          callbackURL: 'https://test.com/callback',
        }),
        expect.any(Function)
      );
    });

    it('should handle successful authentication', async () => {
      initializeRedditPassport();

      const mockReq = {} as any;
      const mockUser = { id: 1 };
      const mockRedditUser = {
        id: 'reddit123',
        name: 'reddit_user',
      };
      const mockToken = 'mock-jwt-token';

      (getCurrentUser as jest.Mock).mockResolvedValue(mockUser);
      (redditOAuth.getUserInfo as jest.Mock).mockResolvedValue(mockRedditUser);
      (connectOAuthProvider as jest.Mock).mockResolvedValue(mockToken);
      (jwt.verify as jest.Mock).mockReturnValue({ id: 1 });
      (redditOAuth.storeUserToken as jest.Mock).mockResolvedValue(undefined);

      const mockDone = jest.fn();

      await mockStrategyCallback(
        mockReq,
        'test-access-token',
        { expires_in: 3600 },
        {},
        mockDone
      );

      expect(getCurrentUser).toHaveBeenCalledWith(mockReq);
      expect(redditOAuth.getUserInfo).toHaveBeenCalledWith('test-access-token');
      expect(connectOAuthProvider).toHaveBeenCalledWith(
        1,
        'reddit',
        'reddit123',
        '',
        'reddit_user'
      );
      expect(mockDone).toHaveBeenCalledWith(null, {
        id: 'reddit123',
        name: 'reddit_user',
        token: mockToken,
      });
    });

    it('should handle missing user', async () => {
      initializeRedditPassport();

      const mockReq = {} as any;
      const mockDone = jest.fn();

      (getCurrentUser as jest.Mock).mockResolvedValue(null);

      await mockStrategyCallback(
        mockReq,
        'test-access-token',
        { expires_in: 3600 },
        {},
        mockDone
      );

      expect(mockDone).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'User not authenticated',
        }),
        null
      );
    });

    it('should handle connectOAuthProvider errors', async () => {
      initializeRedditPassport();

      const mockReq = {} as any;
      const mockUser = { id: 1 };
      const mockRedditUser = {
        id: 'reddit123',
        name: 'reddit_user',
      };
      const mockError = new Error('OAuth connection failed');
      const mockDone = jest.fn();

      (getCurrentUser as jest.Mock).mockResolvedValue(mockUser);
      (redditOAuth.getUserInfo as jest.Mock).mockResolvedValue(mockRedditUser);
      (connectOAuthProvider as jest.Mock).mockResolvedValue(mockError);

      await mockStrategyCallback(
        mockReq,
        'test-access-token',
        { expires_in: 3600 },
        {},
        mockDone
      );

      expect(mockDone).toHaveBeenCalledWith(mockError, null);
    });

    it('should handle general errors', async () => {
      initializeRedditPassport();

      const mockReq = {} as any;
      const mockError = new Error('Authentication failed');
      const mockDone = jest.fn();

      (getCurrentUser as jest.Mock).mockRejectedValue(mockError);

      await mockStrategyCallback(
        mockReq,
        'test-access-token',
        { expires_in: 3600 },
        {},
        mockDone
      );

      expect(mockDone).toHaveBeenCalledWith(mockError, null);
    });
  });
});
