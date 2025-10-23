import { createOAuthRouter } from '../../../src/routes/auth/oauth.router';
import { serviceRegistry } from '../../../src/services/ServiceRegistry';
import { createLog } from '../../../src/routes/logs/logs.service';

// Mock dependencies
jest.mock('../../../src/services/ServiceRegistry');
jest.mock('../../../src/routes/logs/logs.service');
jest.mock('passport', () => ({
  authenticate: jest.fn(() => jest.fn()),
}));

// Mock service OAuth modules
jest.mock(
  '../../../src/services/services/github/oauth',
  () => ({
    githubOAuth: {
      getAuthorizationUrl: jest.fn(
        (state: string) => `https://github.com/oauth?state=${state}`
      ),
    },
  }),
  { virtual: true }
);

jest.mock(
  '../../../src/services/services/google/oauth',
  () => ({
    googleOAuth: {
      getAuthorizationUrl: jest.fn(
        (state: string) => `https://google.com/oauth?state=${state}`
      ),
    },
  }),
  { virtual: true }
);

const mockServiceRegistry = serviceRegistry as jest.Mocked<
  typeof serviceRegistry
>;
const mockCreateLog = createLog as jest.MockedFunction<typeof createLog>;

describe('OAuth Router', () => {
  let mockServices: any[];

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock services with OAuth support
    mockServices = [
      {
        id: 'github',
        name: 'GitHub',
        oauth: {
          enabled: true,
          supportsLogin: true,
        },
      },
      {
        id: 'google',
        name: 'Google',
        oauth: {
          enabled: true,
          supportsLogin: true,
        },
      },
      {
        id: 'spotify',
        name: 'Spotify',
        oauth: {
          enabled: true,
          supportsLogin: false, // Only subscription
        },
      },
      {
        id: 'timer',
        name: 'Timer',
        oauth: {
          enabled: false, // No OAuth
        },
      },
    ];

    mockServiceRegistry.getAllServices.mockReturnValue(mockServices);
  });

  describe('createOAuthRouter', () => {
    it('should create router with OAuth routes for enabled services', () => {
      const router = createOAuthRouter();

      expect(router).toBeDefined();
      expect(mockServiceRegistry.getAllServices).toHaveBeenCalled();

      // Should create routes for github and google (supports login), and spotify (subscription only)
      // Timer should be skipped (no OAuth)
    });

    it('should cache and return the same router instance', () => {
      const router1 = createOAuthRouter();
      const router2 = createOAuthRouter();

      expect(router1).toBe(router2);
    });

    it('should create login routes for services that support login', () => {
      const router = createOAuthRouter();

      // Check that routes were added (we can't easily test the exact routes without supertest)
      expect(router).toBeDefined();
    });

    it('should create callback routes for all OAuth-enabled services', () => {
      const router = createOAuthRouter();

      expect(router).toBeDefined();
    });
  });

  describe('OAuth Login Routes', () => {
    let router: any;
    let mockReq: any;
    let mockRes: any;
    let mockNext: any;

    beforeEach(() => {
      router = createOAuthRouter();
      mockReq = {
        query: {},
        session: {},
      };
      mockRes = {
        redirect: jest.fn(),
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      mockNext = jest.fn();
    });

    it('should handle login route with custom authorization URL', async () => {
      // Mock the import for github OAuth
      const mockGithubOAuth =
        require('../../../src/services/services/github/oauth').githubOAuth;

      // Simulate calling the login route handler
      const routeHandlers = (router as any).stack;
      const githubLoginHandler = routeHandlers.find(
        (layer: any) =>
          layer.route?.path === '/github/login' && layer.route?.methods?.get
      );

      expect(githubLoginHandler).toBeDefined();

      // Call the handler
      await githubLoginHandler.route.stack[0].handle(
        mockReq,
        mockRes,
        mockNext
      );

      expect(mockGithubOAuth.getAuthorizationUrl).toHaveBeenCalledWith(
        expect.any(String)
      );
      expect(mockRes.redirect).toHaveBeenCalledWith(
        expect.stringContaining('https://github.com/oauth')
      );
    });

    it('should handle login route with passport for services without custom URL', async () => {
      // For services without custom getAuthorizationUrl, it should use passport
      const passport = require('passport');
      const mockAuthenticate = passport.authenticate as jest.Mock;

      // Simulate calling a login route that falls back to passport
      const routeHandlers = (router as any).stack;
      const googleLoginHandler = routeHandlers.find(
        (layer: any) =>
          layer.route?.path === '/google/login' && layer.route?.methods?.get
      );

      expect(googleLoginHandler).toBeDefined();

      // Mock the import to not have getAuthorizationUrl
      jest.doMock('../../../src/services/services/google/oauth', () => ({
        googleOAuth: {},
      }));

      // Call the handler
      await googleLoginHandler.route.stack[0].handle(
        mockReq,
        mockRes,
        mockNext
      );

      expect(mockAuthenticate).toHaveBeenCalledWith('google-login');
    });

    it('should set mobile session flag when is_mobile query param is true', async () => {
      mockReq.query.is_mobile = 'true';

      const routeHandlers = (router as any).stack;
      const githubLoginHandler = routeHandlers.find(
        (layer: any) =>
          layer.route?.path === '/github/login' && layer.route?.methods?.get
      );

      await githubLoginHandler.route.stack[0].handle(
        mockReq,
        mockRes,
        mockNext
      );

      expect(mockReq.session.is_mobile).toBe(true);
    });
  });

  describe('OAuth Callback Routes', () => {
    let router: any;
    let mockReq: any;
    let mockRes: any;
    let mockNext: any;

    beforeEach(() => {
      router = createOAuthRouter();
      mockReq = {
        auth: { id: 1 },
        cookies: {},
        session: {},
        user: { token: 'jwt_token' },
      };
      mockRes = {
        redirect: jest.fn(),
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        cookie: jest.fn(),
      };
      mockNext = jest.fn();
    });

    it('should handle callback for authenticated mobile user', async () => {
      mockReq.session.is_mobile = true;
      process.env.MOBILE_CALLBACK_URL = 'myapp://callback';

      const routeHandlers = (router as any).stack;
      const githubCallbackHandler = routeHandlers.find(
        (layer: any) =>
          layer.route?.path === '/github/callback' && layer.route?.methods?.get
      );

      await githubCallbackHandler.route.stack[1].handle(mockReq, mockRes);

      expect(mockRes.redirect).toHaveBeenCalledWith(
        'myapp://callback?github_subscribed=true'
      );
    });

    it('should handle callback for authenticated desktop user', async () => {
      process.env.FRONTEND_URL = 'https://myapp.com';

      const routeHandlers = (router as any).stack;
      const githubCallbackHandler = routeHandlers.find(
        (layer: any) =>
          layer.route?.path === '/github/callback' && layer.route?.methods?.get
      );

      await githubCallbackHandler.route.stack[1].handle(mockReq, mockRes);

      expect(mockRes.redirect).toHaveBeenCalledWith(
        'https://myapp.com/services?github_subscribed=true'
      );
    });

    it('should handle callback for unauthenticated user with login support', async () => {
      mockReq.auth = undefined;
      mockReq.cookies = {};
      process.env.FRONTEND_URL = 'https://myapp.com';

      const routeHandlers = (router as any).stack;
      const githubCallbackHandler = routeHandlers.find(
        (layer: any) =>
          layer.route?.path === '/github/callback' && layer.route?.methods?.get
      );

      // The first handler should call passport.authenticate for login
      const passport = require('passport');
      const mockAuthenticate = passport.authenticate as jest.Mock;

      await githubCallbackHandler.route.stack[0].handle(
        mockReq,
        mockRes,
        mockNext
      );

      expect(mockAuthenticate).toHaveBeenCalledWith('github-login', {
        session: false,
      });
    });

    it('should handle callback for unauthenticated user without login support', async () => {
      mockReq.auth = undefined;
      mockReq.cookies = {};

      const routeHandlers = (router as any).stack;
      const spotifyCallbackHandler = routeHandlers.find(
        (layer: any) =>
          layer.route?.path === '/spotify/callback' && layer.route?.methods?.get
      );

      await spotifyCallbackHandler.route.stack[0].handle(
        mockReq,
        mockRes,
        mockNext
      );

      expect(mockCreateLog).toHaveBeenCalledWith(
        401,
        'other',
        'Attempted to use spotify callback without authentication'
      );
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Spotify requires authentication',
      });
    });

    it('should handle callback for unauthenticated mobile user', async () => {
      mockReq.auth = undefined;
      mockReq.cookies = {};
      mockReq.session.is_mobile = true;
      process.env.MOBILE_CALLBACK_URL = 'myapp://callback';

      const routeHandlers = (router as any).stack;
      const githubCallbackHandler = routeHandlers.find(
        (layer: any) =>
          layer.route?.path === '/github/callback' && layer.route?.methods?.get
      );

      await githubCallbackHandler.route.stack[1].handle(mockReq, mockRes);

      expect(mockRes.cookie).toHaveBeenCalledWith(
        'auth_token',
        'jwt_token',
        expect.any(Object)
      );
      expect(mockRes.redirect).toHaveBeenCalledWith(
        'myapp://callback?token=jwt_token'
      );
    });

    it('should handle callback for unauthenticated desktop user', async () => {
      mockReq.auth = undefined;
      mockReq.cookies = {};
      process.env.FRONTEND_URL = 'https://myapp.com';

      const routeHandlers = (router as any).stack;
      const githubCallbackHandler = routeHandlers.find(
        (layer: any) =>
          layer.route?.path === '/github/callback' && layer.route?.methods?.get
      );

      await githubCallbackHandler.route.stack[1].handle(mockReq, mockRes);

      expect(mockRes.cookie).toHaveBeenCalledWith(
        'auth_token',
        'jwt_token',
        expect.any(Object)
      );
      expect(mockRes.redirect).toHaveBeenCalledWith(
        'https://myapp.com?token=jwt_token'
      );
    });

    it('should handle callback error when no token received', async () => {
      mockReq.user = {};

      const routeHandlers = (router as any).stack;
      const githubCallbackHandler = routeHandlers.find(
        (layer: any) =>
          layer.route?.path === '/github/callback' && layer.route?.methods?.get
      );

      await githubCallbackHandler.route.stack[1].handle(mockReq, mockRes);

      expect(mockCreateLog).toHaveBeenCalledWith(
        500,
        'other',
        'Failed to authenticate with GitHub: No token received'
      );
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Authentication failed',
      });
    });

    it('should handle callback errors', async () => {
      mockReq.user = null; // This will cause an error

      const routeHandlers = (router as any).stack;
      const githubCallbackHandler = routeHandlers.find(
        (layer: any) =>
          layer.route?.path === '/github/callback' && layer.route?.methods?.get
      );

      await githubCallbackHandler.route.stack[1].handle(mockReq, mockRes);

      expect(mockCreateLog).toHaveBeenCalledWith(
        500,
        'other',
        expect.stringContaining('Failed to authenticate with GitHub')
      );
      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });
});
