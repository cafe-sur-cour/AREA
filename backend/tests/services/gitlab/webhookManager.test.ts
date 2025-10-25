import { jest } from '@jest/globals';

// Mock node-fetch
const mockFetch = jest.fn() as any;
jest.mock('node-fetch', () => mockFetch);

// Mock AppDataSource
const mockRepository = {
  find: jest.fn(),
  findOne: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
};
const mockGetRepository = jest.fn(() => mockRepository);
jest.mock('../../../src/config/db', () => ({
  AppDataSource: {
    getRepository: mockGetRepository,
  },
}));

// Mock gitlabOAuth
const mockGetUserToken = jest.fn();
jest.mock('../../../src/services/services/gitlab/oauth', () => ({
  gitlabOAuth: {
    getUserToken: mockGetUserToken,
  },
}));

describe('GitLabWebhookManager', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    process.env.SERVICE_GITLAB_API_BASE_URL = 'https://gitlab.com/api/v4';
    process.env.WEBHOOK_BASE_URL = 'https://example.com';
    process.env.WEBHOOK_SECRET = 'test-webhook-secret';
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('createWebhook', () => {
    it('should create a new webhook successfully', async () => {
      const mockToken = { token_value: 'test-token' };
      const mockGitLabResponse = { id: 12345 };
      const mockSavedWebhook = {
        id: 1,
        user_id: 123,
        service: 'gitlab',
        external_id: '12345',
        repository: 'group/project',
        url: 'https://example.com/api/webhooks/gitlab',
        secret: 'test-webhook-secret',
        events: ['Push Hook'],
        is_active: true,
      };

      mockGetUserToken.mockResolvedValue(mockToken);
      mockRepository.find.mockResolvedValue([]);
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockGitLabResponse),
      });
      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.save.mockResolvedValue(mockSavedWebhook);

      const {
        gitlabWebhookManager,
      } = require('../../../src/services/services/gitlab/webhookManager');

      const config = {
        project: 'group/project',
        events: ['Push Hook'],
      };

      const result = await gitlabWebhookManager.createWebhook(123, config);

      expect(result).toEqual(mockSavedWebhook);
      expect(mockGetUserToken).toHaveBeenCalledWith(123);
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: {
          user_id: 123,
          service: 'gitlab',
          repository: 'group/project',
          is_active: true,
        },
      });
      expect(mockFetch).toHaveBeenCalledWith(
        'https://gitlab.com/api/v4/projects/group%2Fproject/hooks',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
            'Content-Type': 'application/json',
          }),
        })
      );
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should use existing webhook if one exists with same events', async () => {
      const existingWebhook = {
        id: 1,
        user_id: 123,
        service: 'gitlab',
        repository: 'group/project',
        events: ['Push Hook'],
        is_active: true,
      };

      mockRepository.find.mockResolvedValue([existingWebhook]);

      const {
        gitlabWebhookManager,
      } = require('../../../src/services/services/gitlab/webhookManager');

      const config = {
        project: 'group/project',
        events: ['Push Hook'],
      };

      const result = await gitlabWebhookManager.createWebhook(123, config);

      expect(result).toEqual(existingWebhook);
      expect(mockFetch).not.toHaveBeenCalled();
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('should use existing webhook if GitLab returns 422 (already exists)', async () => {
      const mockToken = { token_value: 'test-token' };
      const existingGitLabWebhook = {
        id: 12345,
        url: 'https://example.com/api/webhooks/gitlab',
        project_id: 456,
      };

      mockGetUserToken.mockResolvedValue(mockToken);
      mockRepository.find.mockResolvedValue([]);

      // First call returns 422, second call returns the existing webhook
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 422,
          text: () => Promise.resolve('Conflict'),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([existingGitLabWebhook]),
        });

      mockRepository.findOne.mockResolvedValue(null);
      const mockSavedWebhook = {
        id: 1,
        external_id: '12345',
        is_active: true,
      };
      mockRepository.save.mockResolvedValue(mockSavedWebhook);

      const {
        gitlabWebhookManager,
      } = require('../../../src/services/services/gitlab/webhookManager');

      const config = {
        project: 'group/project',
        events: ['Push Hook'],
      };

      const result = await gitlabWebhookManager.createWebhook(123, config);

      expect(result).toBeDefined();
    });

    it('should throw error if GitLab token not found', async () => {
      mockGetUserToken.mockResolvedValue(null);

      const {
        gitlabWebhookManager,
      } = require('../../../src/services/services/gitlab/webhookManager');

      const config = {
        project: 'group/project',
        events: ['Push Hook'],
      };

      await expect(
        gitlabWebhookManager.createWebhook(123, config)
      ).rejects.toThrow('GitLab token not found for user');
    });

    it('should throw error if GitLab API fails', async () => {
      const mockToken = { token_value: 'test-token' };

      mockGetUserToken.mockResolvedValue(mockToken);
      mockRepository.find.mockResolvedValue([]);
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        text: () => Promise.resolve('Bad Request'),
      });

      const {
        gitlabWebhookManager,
      } = require('../../../src/services/services/gitlab/webhookManager');

      const config = {
        project: 'group/project',
        events: ['Push Hook'],
      };

      await expect(
        gitlabWebhookManager.createWebhook(123, config)
      ).rejects.toThrow('Failed to create GitLab webhook');
    });
  });

  describe('deleteWebhook', () => {
    it('should delete webhook successfully', async () => {
      const mockWebhook = {
        id: 1,
        user_id: 123,
        service: 'gitlab',
        external_id: '12345',
        repository: 'group/project',
      };
      const mockToken = { token_value: 'test-token' };

      mockRepository.findOne.mockResolvedValue(mockWebhook);
      mockGetUserToken.mockResolvedValue(mockToken);
      mockFetch.mockResolvedValue({
        ok: true,
      });
      mockRepository.remove.mockResolvedValue(undefined);

      const {
        gitlabWebhookManager,
      } = require('../../../src/services/services/gitlab/webhookManager');

      await gitlabWebhookManager.deleteWebhook(123, 1);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: {
          id: 1,
          user_id: 123,
          service: 'gitlab',
        },
      });
      expect(mockFetch).toHaveBeenCalledWith(
        'https://gitlab.com/api/v4/projects/group%2Fproject/hooks/12345',
        expect.objectContaining({
          method: 'DELETE',
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
          }),
        })
      );
      expect(mockRepository.remove).toHaveBeenCalledWith(mockWebhook);
    });

    it('should throw error if webhook not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const {
        gitlabWebhookManager,
      } = require('../../../src/services/services/gitlab/webhookManager');

      await expect(gitlabWebhookManager.deleteWebhook(123, 1)).rejects.toThrow(
        'Webhook not found'
      );
    });

    it('should throw error if GitLab token not found', async () => {
      const mockWebhook = {
        id: 1,
        user_id: 123,
        service: 'gitlab',
      };

      mockRepository.findOne.mockResolvedValue(mockWebhook);
      mockGetUserToken.mockResolvedValue(null);

      const {
        gitlabWebhookManager,
      } = require('../../../src/services/services/gitlab/webhookManager');

      await expect(gitlabWebhookManager.deleteWebhook(123, 1)).rejects.toThrow(
        'GitLab token not found for user'
      );
    });

    it('should handle 404 response from GitLab gracefully', async () => {
      const mockWebhook = {
        id: 1,
        user_id: 123,
        service: 'gitlab',
        external_id: '12345',
        repository: 'group/project',
      };
      const mockToken = { token_value: 'test-token' };

      mockRepository.findOne.mockResolvedValue(mockWebhook);
      mockGetUserToken.mockResolvedValue(mockToken);
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
      });
      mockRepository.remove.mockResolvedValue(undefined);

      const {
        gitlabWebhookManager,
      } = require('../../../src/services/services/gitlab/webhookManager');

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      await gitlabWebhookManager.deleteWebhook(123, 1);

      expect(mockRepository.remove).toHaveBeenCalledWith(mockWebhook);
      consoleSpy.mockRestore();
    });
  });

  describe('getUserWebhooks', () => {
    it('should get user webhooks successfully', async () => {
      const mockWebhooks = [
        {
          id: 1,
          user_id: 123,
          service: 'gitlab',
          repository: 'group/project1',
        },
        {
          id: 2,
          user_id: 123,
          service: 'gitlab',
          repository: 'group/project2',
        },
      ];

      mockRepository.find.mockResolvedValue(mockWebhooks);

      const {
        gitlabWebhookManager,
      } = require('../../../src/services/services/gitlab/webhookManager');

      const result = await gitlabWebhookManager.getUserWebhooks(123);

      expect(result).toEqual(mockWebhooks);
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: {
          user_id: 123,
          service: 'gitlab',
        },
        order: {
          created_at: 'DESC',
        },
      });
    });

    it('should return empty array if user has no webhooks', async () => {
      mockRepository.find.mockResolvedValue([]);

      const {
        gitlabWebhookManager,
      } = require('../../../src/services/services/gitlab/webhookManager');

      const result = await gitlabWebhookManager.getUserWebhooks(123);

      expect(result).toEqual([]);
    });
  });
});
