import { jest } from '@jest/globals';

// Mock the imported modules
const mockGitlabActions = [
  {
    id: 'push',
    name: 'Push',
    description: 'Triggered when code is pushed to repository',
  },
];

const mockGitlabReactions = [
  {
    id: 'create_issue',
    name: 'Create Issue',
    description: 'Creates a new issue in the project',
  },
];

const mockGitlabReactionExecutor = {
  execute: jest.fn(),
};

const mockGitlabOAuth = {
  getUserToken: jest.fn<() => Promise<any>>(),
};

const mockGitlabWebhookManager = {
  createWebhook: jest.fn<() => Promise<any>>(),
  deleteWebhook: jest.fn<() => Promise<void>>(),
};

// Mock the modules
jest.mock('../../../src/services/services/gitlab/action', () => ({
  gitlabActions: mockGitlabActions,
}));

jest.mock('../../../src/services/services/gitlab/reactions', () => ({
  gitlabReactions: mockGitlabReactions,
}));

jest.mock('../../../src/services/services/gitlab/executor', () => ({
  gitlabReactionExecutor: mockGitlabReactionExecutor,
}));

jest.mock('../../../src/services/services/gitlab/oauth', () => ({
  gitlabOAuth: mockGitlabOAuth,
}));

jest.mock('../../../src/services/services/gitlab/webhookManager', () => ({
  gitlabWebhookManager: mockGitlabWebhookManager,
}));

jest.mock('../../../src/services/services/gitlab/passport', () => ({
  initializeGitLabPassport: jest.fn(),
}));

describe('GitLab Service', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('service definition', () => {
    it('should export a valid service object', async () => {
      const { default: gitlabService } = await import(
        '../../../src/services/services/gitlab/index'
      );

      expect(gitlabService).toEqual({
        id: 'gitlab',
        name: 'GitLab',
        description: 'GitLab service for repository events and actions',
        version: '1.0.0',
        icon: expect.stringContaining('<svg'),
        actions: mockGitlabActions,
        reactions: mockGitlabReactions,
        oauth: {
          enabled: true,
        },
        getCredentials: expect.any(Function),
        deleteWebhook: expect.any(Function),
        ensureWebhookForMapping: expect.any(Function),
      });
    });

    it('should export the executor', async () => {
      const { executor } = await import(
        '../../../src/services/services/gitlab/index'
      );

      expect(executor).toBe(mockGitlabReactionExecutor);
    });
  });

  describe('getCredentials', () => {
    it('should return credentials when token exists', async () => {
      const mockToken = { token_value: 'test-token' };
      mockGitlabOAuth.getUserToken.mockResolvedValue(mockToken);

      const { default: gitlabService } = await import(
        '../../../src/services/services/gitlab/index'
      );

      const credentials = await (gitlabService as any).getCredentials(123);

      expect(credentials).toEqual({ access_token: 'test-token' });
      expect(mockGitlabOAuth.getUserToken).toHaveBeenCalledWith(123);
    });

    it('should return empty object when no token exists', async () => {
      mockGitlabOAuth.getUserToken.mockResolvedValue(null);

      const { default: gitlabService } = await import(
        '../../../src/services/services/gitlab/index'
      );

      const credentials = await (gitlabService as any).getCredentials(123);

      expect(credentials).toEqual({});
    });
  });

  describe('deleteWebhook', () => {
    it('should call webhookManager.deleteWebhook', async () => {
      mockGitlabWebhookManager.deleteWebhook.mockResolvedValue(undefined);

      const { default: gitlabService } = await import(
        '../../../src/services/services/gitlab/index'
      );

      await (gitlabService as any).deleteWebhook(123, 456);

      expect(mockGitlabWebhookManager.deleteWebhook).toHaveBeenCalledWith(
        123,
        456
      );
    });
  });

  describe('ensureWebhookForMapping', () => {
    it('should create webhook when mapping has valid project and webhook pattern', async () => {
      const mockMapping = {
        action: {
          type: 'gitlab.push',
          config: {
            project: 'my-group/my-project',
          },
        },
      };

      const mockActionDefinition = {
        metadata: {
          webhookPattern: 'Push Hook',
        },
      };

      mockGitlabWebhookManager.createWebhook.mockResolvedValue({
        id: 1,
        project: 'my-group/my-project',
      });

      const { default: gitlabService } = await import(
        '../../../src/services/services/gitlab/index'
      );

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await (gitlabService as any).ensureWebhookForMapping(
        mockMapping,
        123,
        mockActionDefinition
      );

      expect(mockGitlabWebhookManager.createWebhook).toHaveBeenCalledWith(123, {
        project: 'my-group/my-project',
        events: ['Push Hook'],
      });

      consoleSpy.mockRestore();
    });

    it('should warn when project is missing from config', async () => {
      const mockMapping = {
        action: {
          type: 'gitlab.push',
          config: {},
        },
      };

      const mockActionDefinition = {
        metadata: {
          webhookPattern: 'Push Hook',
        },
      };

      const { default: gitlabService } = await import(
        '../../../src/services/services/gitlab/index'
      );

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      await (gitlabService as any).ensureWebhookForMapping(
        mockMapping,
        123,
        mockActionDefinition
      );

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Cannot create webhook for mapping')
      );

      consoleSpy.mockRestore();
    });

    it('should skip webhook creation when no webhook pattern is defined', async () => {
      const mockMapping = {
        action: {
          type: 'gitlab.push',
          config: {
            project: 'my-group/my-project',
          },
        },
      };

      const mockActionDefinition = {
        metadata: {},
      };

      const { default: gitlabService } = await import(
        '../../../src/services/services/gitlab/index'
      );

      await (gitlabService as any).ensureWebhookForMapping(
        mockMapping,
        123,
        mockActionDefinition
      );

      expect(mockGitlabWebhookManager.createWebhook).not.toHaveBeenCalled();
    });
  });

  describe('initialize', () => {
    it('should initialize GitLab passport', async () => {
      const { initializeGitLabPassport } = require(
        '../../../src/services/services/gitlab/passport'
      );

      const { initialize } = await import(
        '../../../src/services/services/gitlab/index'
      );

      await initialize();

      expect(initializeGitLabPassport).toHaveBeenCalled();
    });
  });
});
