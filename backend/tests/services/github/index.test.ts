import { jest } from '@jest/globals';

// Mock the imported modules
const mockGithubActions = [
  {
    id: 'push',
    name: 'Push',
    description: 'Triggered when code is pushed to repository',
  },
];

const mockGithubReactions = [
  {
    id: 'create_issue',
    name: 'Create Issue',
    description: 'Creates a new issue in the repository',
  },
];

const mockGithubReactionExecutor = {
  execute: jest.fn(),
};

const mockGithubOAuth = {
  getUserToken: jest.fn<() => Promise<any>>(),
};

const mockGithubWebhookManager = {
  createWebhook: jest.fn<() => Promise<any>>(),
  deleteWebhook: jest.fn<() => Promise<void>>(),
};

// Mock the modules
jest.mock('../../../src/services/services/github/actions', () => ({
  githubActions: mockGithubActions,
}));

jest.mock('../../../src/services/services/github/reactions', () => ({
  githubReactions: mockGithubReactions,
}));

jest.mock('../../../src/services/services/github/executor', () => ({
  githubReactionExecutor: mockGithubReactionExecutor,
}));

jest.mock('../../../src/services/services/github/oauth', () => ({
  githubOAuth: mockGithubOAuth,
}));

jest.mock('../../../src/services/services/github/webhookManager', () => ({
  githubWebhookManager: mockGithubWebhookManager,
}));

jest.mock('../../../src/services/services/github/passport', () => ({
  initializeGitHubPassport: jest.fn(),
}));

// Import the mocked function
const {
  initializeGitHubPassport: mockInitializeGitHubPassport,
} = require('../../../src/services/services/github/passport');

describe('GitHub Service', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    process.env.GITHUB_APP_SLUG = 'test-app-slug';
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('service definition', () => {
    it('should export a valid service object', async () => {
      const { default: githubService } = await import(
        '../../../src/services/services/github/index'
      );

      expect(githubService).toEqual({
        id: 'github',
        name: 'GitHub',
        description: 'GitHub service for repository events and actions',
        version: '1.0.0',
        icon: expect.stringContaining('<svg'),
        actions: mockGithubActions,
        reactions: mockGithubReactions,
        oauth: {
          enabled: true,
          supportsLogin: true,
          getSubscriptionUrl: expect.any(Function),
        },
        getCredentials: expect.any(Function),
        deleteWebhook: expect.any(Function),
        ensureWebhookForMapping: expect.any(Function),
      });
    });

    it('should export the executor', async () => {
      const { executor } = await import(
        '../../../src/services/services/github/index'
      );

      expect(executor).toBe(mockGithubReactionExecutor);
    });
  });

  describe('oauth.getSubscriptionUrl', () => {
    it('should return subscription URL with user ID', async () => {
      const { default: githubService } = await import(
        '../../../src/services/services/github/index'
      );

      expect(githubService.oauth).toBeDefined();
      expect((githubService as any).oauth.getSubscriptionUrl).toBeDefined();
      const url = (githubService as any).oauth.getSubscriptionUrl(123);

      expect(url).toBe(
        'https://github.com/apps/test-app-slug/installations/new?state=123'
      );
    });

    it('should use default app slug if not set', async () => {
      delete process.env.GITHUB_APP_SLUG;

      const { default: githubService } = await import(
        '../../../src/services/services/github/index'
      );

      expect(githubService.oauth).toBeDefined();
      expect((githubService as any).oauth.getSubscriptionUrl).toBeDefined();
      const url = (githubService as any).oauth.getSubscriptionUrl(456);

      expect(url).toBe(
        'https://github.com/apps/area-cafe-sur-cours/installations/new?state=456'
      );
    });
  });

  describe('getCredentials', () => {
    it('should return credentials when token exists', async () => {
      const mockToken = { token_value: 'test-token' };
      mockGithubOAuth.getUserToken.mockResolvedValue(mockToken);

      const { default: githubService } = await import(
        '../../../src/services/services/github/index'
      );

      expect((githubService as any).getCredentials).toBeDefined();
      const credentials = await (githubService as any).getCredentials(123);

      expect(credentials).toEqual({ access_token: 'test-token' });
      expect(mockGithubOAuth.getUserToken).toHaveBeenCalledWith(123);
    });

    it('should return empty object when no token exists', async () => {
      mockGithubOAuth.getUserToken.mockResolvedValue(null);

      const { default: githubService } = await import(
        '../../../src/services/services/github/index'
      );

      expect((githubService as any).getCredentials).toBeDefined();
      const credentials = await (githubService as any).getCredentials(123);

      expect(credentials).toEqual({});
    });
  });

  describe('deleteWebhook', () => {
    it('should call webhookManager.deleteWebhook', async () => {
      mockGithubWebhookManager.deleteWebhook.mockResolvedValue(undefined);

      const { default: githubService } = await import(
        '../../../src/services/services/github/index'
      );

      expect((githubService as any).deleteWebhook).toBeDefined();
      await (githubService as any).deleteWebhook(123, 456);

      expect(mockGithubWebhookManager.deleteWebhook).toHaveBeenCalledWith(
        123,
        456
      );
    });
  });

  describe('ensureWebhookForMapping', () => {
    it('should create webhook when mapping has valid repository and webhook pattern', async () => {
      const mockMapping = {
        action: {
          type: 'github.push',
          config: {
            repository: 'owner/repo',
          },
        },
      };

      const mockActionDefinition = {
        id: 'push',
        name: 'Push',
        description: 'Push action',
        configSchema: {},
        inputSchema: {},
        metadata: {
          webhookPattern: 'push',
        },
      };

      mockGithubWebhookManager.createWebhook.mockResolvedValue({});

      const { default: githubService } = await import(
        '../../../src/services/services/github/index'
      );

      expect((githubService as any).ensureWebhookForMapping).toBeDefined();
      await (githubService as any).ensureWebhookForMapping(
        mockMapping,
        123,
        mockActionDefinition
      );

      expect(mockGithubWebhookManager.createWebhook).toHaveBeenCalledWith(123, {
        repository: 'owner/repo',
        events: ['push'],
      });
    });

    it('should not create webhook when webhookPattern is missing', async () => {
      const mockMapping = {
        action: {
          type: 'github.push',
          config: {
            repository: 'owner/repo',
          },
        },
      };

      const mockActionDefinition = {
        id: 'push',
        name: 'Push',
        description: 'Push action',
        configSchema: {},
        inputSchema: {},
        metadata: {},
      } as any;

      const { default: githubService } = await import(
        '../../../src/services/services/github/index'
      );

      expect((githubService as any).ensureWebhookForMapping).toBeDefined();
      await (githubService as any).ensureWebhookForMapping(
        mockMapping,
        123,
        mockActionDefinition
      );

      expect(mockGithubWebhookManager.createWebhook).not.toHaveBeenCalled();
    });

    it('should not create webhook when repository is missing', async () => {
      const mockMapping = {
        action: {
          type: 'github.push',
          config: {},
        },
      };

      const mockActionDefinition = {
        id: 'push',
        name: 'Push',
        description: 'Push action',
        configSchema: {},
        inputSchema: {},
        metadata: {
          webhookPattern: 'push',
        },
      } as any;

      const { default: githubService } = await import(
        '../../../src/services/services/github/index'
      );

      expect((githubService as any).ensureWebhookForMapping).toBeDefined();
      await (githubService as any).ensureWebhookForMapping(
        mockMapping,
        123,
        mockActionDefinition
      );

      expect(mockGithubWebhookManager.createWebhook).not.toHaveBeenCalled();
    });

    it('should handle webhook creation errors gracefully', async () => {
      const mockMapping = {
        action: {
          type: 'github.push',
          config: {
            repository: 'owner/repo',
          },
        },
      };

      const mockActionDefinition = {
        id: 'push',
        name: 'Push',
        description: 'Push action',
        configSchema: {},
        inputSchema: {},
        metadata: {
          webhookPattern: 'push',
        },
      } as any;

      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      mockGithubWebhookManager.createWebhook.mockRejectedValue(
        new Error('Webhook creation failed')
      );

      const { default: githubService } = await import(
        '../../../src/services/services/github/index'
      );

      expect((githubService as any).ensureWebhookForMapping).toBeDefined();
      await (githubService as any).ensureWebhookForMapping(
        mockMapping,
        123,
        mockActionDefinition
      );

      expect(mockGithubWebhookManager.createWebhook).toHaveBeenCalledWith(123, {
        repository: 'owner/repo',
        events: ['push'],
      });
      expect(consoleSpy).toHaveBeenCalledWith(
        '❌ Failed to create webhook for mapping:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });

    it('should not create webhook when repository is missing', async () => {
      const mockMapping = {
        action: {
          type: 'github.push',
          config: {},
        },
      };

      const mockActionDefinition = {
        id: 'push',
        name: 'Push',
        description: 'Push action',
        configSchema: {},
        inputSchema: {},
        metadata: {
          webhookPattern: 'push',
        },
      };

      const { default: githubService } = await import(
        '../../../src/services/services/github/index'
      );

      expect((githubService as any).ensureWebhookForMapping).toBeDefined();
      await (githubService as any).ensureWebhookForMapping(
        mockMapping,
        123,
        mockActionDefinition
      );

      expect(mockGithubWebhookManager.createWebhook).not.toHaveBeenCalled();
    });

    it('should handle webhook creation errors gracefully', async () => {
      const mockMapping = {
        action: {
          type: 'github.push',
          config: {
            repository: 'owner/repo',
          },
        },
      };

      const mockActionDefinition = {
        id: 'push',
        name: 'Push',
        description: 'Push action',
        configSchema: {},
        inputSchema: {},
        metadata: {
          webhookPattern: 'push',
        },
      };

      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      mockGithubWebhookManager.createWebhook.mockRejectedValue(
        new Error('Webhook creation failed')
      );

      const { default: githubService } = await import(
        '../../../src/services/services/github/index'
      );

      expect((githubService as any).ensureWebhookForMapping).toBeDefined();
      await (githubService as any).ensureWebhookForMapping(
        mockMapping,
        123,
        mockActionDefinition
      );

      expect(mockGithubWebhookManager.createWebhook).toHaveBeenCalledWith(123, {
        repository: 'owner/repo',
        events: ['push'],
      });
      expect(consoleSpy).toHaveBeenCalledWith(
        '❌ Failed to create webhook for mapping:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('getCredentials', () => {
    it('should return credentials when token exists', async () => {
      const mockToken = { token_value: 'test-token' };
      mockGithubOAuth.getUserToken.mockResolvedValue(mockToken);

      const { default: githubService } = await import(
        '../../../src/services/services/github/index'
      );

      expect(githubService.getCredentials).toBeDefined();
      const credentials = await githubService.getCredentials!(123);

      expect(credentials).toEqual({ access_token: 'test-token' });
      expect(mockGithubOAuth.getUserToken).toHaveBeenCalledWith(123);
    });

    it('should return empty object when no token exists', async () => {
      mockGithubOAuth.getUserToken.mockResolvedValue(null);

      const { default: githubService } = await import(
        '../../../src/services/services/github/index'
      );

      expect(githubService.getCredentials).toBeDefined();
      const credentials = await githubService.getCredentials!(123);

      expect(credentials).toEqual({});
    });
  });

  describe('deleteWebhook', () => {
    it('should call webhookManager.deleteWebhook', async () => {
      mockGithubWebhookManager.deleteWebhook.mockResolvedValue(undefined);

      const { default: githubService } = await import(
        '../../../src/services/services/github/index'
      );

      expect(githubService.deleteWebhook).toBeDefined();
      await githubService.deleteWebhook!(123, 456);

      expect(mockGithubWebhookManager.deleteWebhook).toHaveBeenCalledWith(
        123,
        456
      );
    });
  });

  describe('ensureWebhookForMapping', () => {
    it('should create webhook when mapping has valid repository and webhook pattern', async () => {
      const mockMapping = {
        action: {
          type: 'github.push',
          config: {
            repository: 'owner/repo',
          },
        },
      };

      const mockActionDefinition = {
        metadata: {
          webhookPattern: 'push',
        },
      };

      mockGithubWebhookManager.createWebhook.mockResolvedValue({});

      const { default: githubService } = await import(
        '../../../src/services/services/github/index'
      );

      expect(githubService.ensureWebhookForMapping).toBeDefined();
      await githubService.ensureWebhookForMapping!(
        mockMapping,
        123,
        mockActionDefinition
      );

      expect(mockGithubWebhookManager.createWebhook).toHaveBeenCalledWith(123, {
        repository: 'owner/repo',
        events: ['push'],
      });
    });

    it('should not create webhook when webhookPattern is missing', async () => {
      const mockMapping = {
        action: {
          type: 'github.push',
          config: {
            repository: 'owner/repo',
          },
        },
      };

      const mockActionDefinition = {
        metadata: {},
      };

      const { default: githubService } = await import(
        '../../../src/services/services/github/index'
      );

      expect(githubService.ensureWebhookForMapping).toBeDefined();
      await githubService.ensureWebhookForMapping!(
        mockMapping,
        123,
        mockActionDefinition
      );

      expect(mockGithubWebhookManager.createWebhook).not.toHaveBeenCalled();
    });

    it('should not create webhook when repository is missing', async () => {
      const mockMapping = {
        action: {
          type: 'github.push',
          config: {},
        },
      };

      const mockActionDefinition = {
        metadata: {
          webhookPattern: 'push',
        },
      };

      const { default: githubService } = await import(
        '../../../src/services/services/github/index'
      );

      expect(githubService.ensureWebhookForMapping).toBeDefined();
      await githubService.ensureWebhookForMapping!(
        mockMapping,
        123,
        mockActionDefinition
      );

      expect(mockGithubWebhookManager.createWebhook).not.toHaveBeenCalled();
    });

    it('should handle webhook creation errors gracefully', async () => {
      const mockMapping = {
        action: {
          type: 'github.push',
          config: {
            repository: 'owner/repo',
          },
        },
      };

      const mockActionDefinition = {
        metadata: {
          webhookPattern: 'push',
        },
      };

      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      mockGithubWebhookManager.createWebhook.mockRejectedValue(
        new Error('Webhook creation failed')
      );

      const { default: githubService } = await import(
        '../../../src/services/services/github/index'
      );

      expect(githubService.ensureWebhookForMapping).toBeDefined();
      await githubService.ensureWebhookForMapping!(
        mockMapping,
        123,
        mockActionDefinition
      );

      expect(mockGithubWebhookManager.createWebhook).toHaveBeenCalledWith(123, {
        repository: 'owner/repo',
        events: ['push'],
      });
      expect(consoleSpy).toHaveBeenCalledWith(
        '❌ Failed to create webhook for mapping:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('initialize', () => {
    it('should initialize GitHub passport', async () => {
      const consoleSpy = jest
        .spyOn(console, 'log')
        .mockImplementation(() => {});

      const { initialize } = await import(
        '../../../src/services/services/github/index'
      );

      await initialize();

      expect(mockInitializeGitHubPassport).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith('Initializing GitHub service...');
      expect(consoleSpy).toHaveBeenCalledWith('GitHub service initialized');

      consoleSpy.mockRestore();
    });
  });

  describe('cleanup', () => {
    it('should cleanup GitHub service', async () => {
      const consoleSpy = jest
        .spyOn(console, 'log')
        .mockImplementation(() => {});

      const { cleanup } = await import(
        '../../../src/services/services/github/index'
      );

      await cleanup();

      expect(consoleSpy).toHaveBeenCalledWith('Cleaning up GitHub service...');
      expect(consoleSpy).toHaveBeenCalledWith('GitHub service cleaned up');

      consoleSpy.mockRestore();
    });
  });
});
