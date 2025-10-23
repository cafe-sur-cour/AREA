// Mock modules before imports
jest.mock('../../../src/services/services/reddit/executor', () => ({
  redditReactionExecutor: {},
}));

jest.mock('../../../src/services/services/reddit/passport', () => ({
  initializeRedditPassport: jest.fn(),
}));

jest.mock('../../../src/services/services/reddit/RedditScheduler', () => ({
  redditScheduler: {
    start: jest.fn(),
    stop: jest.fn(),
  },
}));

jest.mock('../../../src/services/services/reddit/oauth', () => ({
  redditOAuth: {
    getUserToken: jest.fn(),
  },
}));

describe('Reddit Service', () => {
  let redditService: any;
  let executor: any;
  let initialize: () => Promise<void>;
  let cleanup: () => Promise<void>;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await import('../../../src/services/services/reddit/index');
    redditService = module.default;
    executor = module.executor;
    initialize = module.initialize;
    cleanup = module.cleanup;
  });
  describe('Service Definition', () => {
    it('should have correct service metadata', () => {
      expect(redditService.id).toBe('reddit');
      expect(redditService.name).toBe('Reddit');
      expect(redditService.description).toBe(
        'Reddit service for social media integration'
      );
      expect(redditService.version).toBe('1.0.0');
    });

    it('should have icon defined', () => {
      expect(redditService.icon).toBeDefined();
      expect(typeof redditService.icon).toBe('string');
      expect(redditService.icon).toContain('svg');
    });

    it('should have actions array', () => {
      expect(Array.isArray(redditService.actions)).toBe(true);
      expect(redditService.actions.length).toBeGreaterThan(0);
    });

    it('should have reactions array', () => {
      expect(Array.isArray(redditService.reactions)).toBe(true);
      expect(redditService.reactions.length).toBeGreaterThan(0);
    });

    it('should have oauth configuration', () => {
      expect(redditService.oauth).toBeDefined();
      expect(redditService.oauth?.enabled).toBe(true);
      expect(redditService.oauth?.supportsLogin).toBe(false);
    });
  });

  describe('getSubscriptionUrl', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      jest.resetModules();
      process.env = { ...originalEnv };
    });

    afterAll(() => {
      process.env = originalEnv;
    });

    it('should generate subscription URL with correct parameters', () => {
      process.env.SERVICE_REDDIT_API_BASE_URL = 'https://www.reddit.com';
      process.env.SERVICE_REDDIT_CLIENT_ID = 'test_client_id';
      process.env.SERVICE_REDDIT_REDIRECT_URI = 'http://localhost/callback';
      process.env.BACKEND_URL = 'http://localhost:3000';

      const userId = 123;
      const url = redditService.oauth?.getSubscriptionUrl?.(userId);

      expect(url).toBeDefined();
      expect(url).toContain('https://www.reddit.com/api/v1/authorize');
      expect(url).toContain('client_id=test_client_id');
      expect(url).toContain('response_type=code');
      expect(url).toContain('state=123');
      expect(url).toContain('duration=permanent');
      expect(url).toContain('scope=');
      expect(url).toContain('identity');
      expect(url).toContain('read');
      expect(url).toContain('vote');
      expect(url).toContain('submit');
    });

    it('should use default values when environment variables are not set', () => {
      delete process.env.SERVICE_REDDIT_API_BASE_URL;
      delete process.env.SERVICE_REDDIT_CLIENT_ID;
      delete process.env.SERVICE_REDDIT_REDIRECT_URI;
      delete process.env.BACKEND_URL;

      const userId = 456;
      const url = redditService.oauth?.getSubscriptionUrl?.(userId);

      expect(url).toBeDefined();
      expect(url).toContain('/api/v1/authorize');
      expect(url).toContain('state=456');
    });
  });

  describe('getCredentials', () => {
    it('should return access token when user is authenticated', async () => {
      const { redditOAuth } = await import(
        '../../../src/services/services/reddit/oauth'
      );
      (redditOAuth.getUserToken as jest.Mock).mockResolvedValue({
        token_value: 'test_access_token',
        scopes: ['identity', 'read'],
      });

      const credentials = await redditService.getCredentials?.(1);

      expect(redditOAuth.getUserToken).toHaveBeenCalledWith(1);
      expect(credentials).toEqual({ access_token: 'test_access_token' });
    });

    it('should return empty object when user is not authenticated', async () => {
      const { redditOAuth } = await import(
        '../../../src/services/services/reddit/oauth'
      );
      (redditOAuth.getUserToken as jest.Mock).mockResolvedValue(null);

      const credentials = await redditService.getCredentials?.(1);

      expect(redditOAuth.getUserToken).toHaveBeenCalledWith(1);
      expect(credentials).toEqual({});
    });
  });

  describe('initialize', () => {
    it('should initialize passport and scheduler', async () => {
      const { initializeRedditPassport } = await import(
        '../../../src/services/services/reddit/passport'
      );
      const { redditScheduler } = await import(
        '../../../src/services/services/reddit/RedditScheduler'
      );

      (redditScheduler.start as jest.Mock).mockResolvedValue(undefined);
      (initializeRedditPassport as jest.Mock).mockReturnValue(undefined);

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await initialize();

      expect(consoleSpy).toHaveBeenCalledWith('Initializing Reddit service...');
      expect(initializeRedditPassport).toHaveBeenCalled();
      expect(redditScheduler.start).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith('Reddit service initialized');

      consoleSpy.mockRestore();
    });
  });

  describe('cleanup', () => {
    it('should stop scheduler', async () => {
      const { redditScheduler } = await import(
        '../../../src/services/services/reddit/RedditScheduler'
      );

      (redditScheduler.stop as jest.Mock).mockResolvedValue(undefined);

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await cleanup();

      expect(consoleSpy).toHaveBeenCalledWith('Cleaning up Reddit service...');
      expect(redditScheduler.stop).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith('Reddit service cleaned up');

      consoleSpy.mockRestore();
    });
  });
});
