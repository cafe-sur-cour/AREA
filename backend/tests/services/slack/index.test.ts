jest.mock('../../../src/services/services/slack/executor', () => ({
  slackReactionExecutor: {},
}));

jest.mock('../../../src/services/services/slack/passport', () => ({
  initializeSlackPassport: jest.fn(),
}));

jest.mock('../../../src/services/services/slack/oauth', () => ({
  slackOAuth: {
    getUserToken: jest.fn(),
  },
}));

describe('Slack Service', () => {
  let slackService: any;
  let executor: any;
  let initialize: () => Promise<void>;
  let cleanup: () => Promise<void>;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await import('../../../src/services/services/slack/index');
    slackService = module.default;
    executor = module.executor;
    initialize = module.initialize;
    cleanup = module.cleanup;
  });

  describe('service definition', () => {
    it('should have correct id', () => {
      expect(slackService.id).toBe('slack');
    });

    it('should have correct name', () => {
      expect(slackService.name).toBe('Slack');
    });

    it('should have correct description', () => {
      expect(slackService.description).toBe(
        'Slack service for team communication integration'
      );
    });

    it('should have correct version', () => {
      expect(slackService.version).toBe('1.0.0');
    });

    it('should have icon', () => {
      expect(slackService.icon).toBeDefined();
      expect(slackService.icon).toContain('svg');
    });

    it('should have actions array', () => {
      expect(slackService.actions).toBeDefined();
      expect(Array.isArray(slackService.actions)).toBe(true);
      expect(slackService.actions.length).toBeGreaterThan(0);
    });

    it('should have reactions array', () => {
      expect(slackService.reactions).toBeDefined();
      expect(Array.isArray(slackService.reactions)).toBe(true);
      expect(slackService.reactions.length).toBeGreaterThan(0);
    });

    it('should have oauth configuration', () => {
      expect(slackService.oauth).toBeDefined();
      expect(slackService.oauth.enabled).toBe(true);
      expect(slackService.oauth.supportsLogin).toBe(false);
    });

    it('should have getCredentials function', () => {
      expect(slackService.getCredentials).toBeDefined();
      expect(typeof slackService.getCredentials).toBe('function');
    });
  });

  describe('executor', () => {
    it('should export executor', () => {
      expect(executor).toBeDefined();
    });
  });

  describe('getCredentials', () => {
    it('should return credentials when token exists', async () => {
      const { slackOAuth } = await import(
        '../../../src/services/services/slack/oauth'
      );
      (slackOAuth.getUserToken as jest.Mock).mockResolvedValue({
        token_value: 'xoxb-test-token',
      });

      const credentials = await slackService.getCredentials(1);

      expect(slackOAuth.getUserToken).toHaveBeenCalledWith(1);
      expect(credentials).toEqual({ access_token: 'xoxb-test-token' });
    });

    it('should return empty object when no token found', async () => {
      const { slackOAuth } = await import(
        '../../../src/services/services/slack/oauth'
      );
      (slackOAuth.getUserToken as jest.Mock).mockResolvedValue(null);

      const credentials = await slackService.getCredentials(1);

      expect(credentials).toEqual({});
    });
  });

  describe('initialize', () => {
    it('should initialize Slack passport', async () => {
      const { initializeSlackPassport } = await import(
        '../../../src/services/services/slack/passport'
      );

      await initialize();

      expect(initializeSlackPassport).toHaveBeenCalled();
    });
  });

  describe('cleanup', () => {
    it('should cleanup successfully', async () => {
      await expect(cleanup()).resolves.not.toThrow();
    });
  });
});
