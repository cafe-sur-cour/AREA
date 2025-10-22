import { jest } from '@jest/globals';

// Mock node-fetch
const mockFetch = jest.fn() as any;
jest.mock('node-fetch', () => mockFetch);

// Mock crypto
const mockRandomBytes = jest.fn() as any;
jest.mock('crypto', () => ({
  randomBytes: mockRandomBytes,
}));

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

// Mock githubOAuth
const mockGetUserToken = jest.fn();
jest.mock('../../../src/services/services/github/oauth', () => ({
  githubOAuth: {
    getUserToken: mockGetUserToken,
  },
}));

describe('GitHubWebhookManager', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    process.env.SERVICE_GITHUB_API_BASE_URL = 'https://api.github.com';
    process.env.WEBHOOK_BASE_URL = 'https://example.com';
    process.env.WEBHOOK_SECRET = 'test-webhook-secret';

    mockRandomBytes.mockReturnValue(Buffer.from('random-secret-32-bytes-long'));
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('createWebhook', () => {
    it('should create a new webhook successfully', async () => {
      const mockToken = { token_value: 'test-token' };
      const mockGitHubResponse = { id: 12345 };
      const mockSavedWebhook = {
        id: 1,
        user_id: 123,
        service: 'github',
        external_id: '12345',
        repository: 'owner/repo',
        url: 'https://example.com/api/webhooks/github',
        secret: 'test-webhook-secret',
        events: ['push', 'pull_request'],
        is_active: true,
      };

      mockGetUserToken.mockResolvedValue(mockToken);
      mockRepository.find.mockResolvedValue([]);
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockGitHubResponse),
      });
      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.save.mockResolvedValue(mockSavedWebhook);

      const {
        githubWebhookManager,
      } = require('../../../src/services/services/github/webhookManager');

      const config = {
        repository: 'owner/repo',
        events: ['push', 'pull_request'],
      };

      const result = await githubWebhookManager.createWebhook(123, config);

      expect(result).toEqual(mockSavedWebhook);
      expect(mockGetUserToken).toHaveBeenCalledWith(123);
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: {
          user_id: 123,
          service: 'github',
          repository: 'owner/repo',
          is_active: true,
        },
      });
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.github.com/repos/owner/repo/hooks',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify({
            name: 'web',
            active: true,
            events: ['push', 'pull_request'],
            config: {
              url: 'https://example.com/api/webhooks/github',
              content_type: 'json',
              secret: 'test-webhook-secret',
            },
          }),
        })
      );
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should use existing webhook if one exists with same events', async () => {
      const existingWebhook = {
        id: 1,
        user_id: 123,
        service: 'github',
        repository: 'owner/repo',
        events: ['push', 'pull_request'],
        is_active: true,
      };

      mockRepository.find.mockResolvedValue([existingWebhook]);

      const {
        githubWebhookManager,
      } = require('../../../src/services/services/github/webhookManager');

      const config = {
        repository: 'owner/repo',
        events: ['push', 'pull_request'],
      };

      const result = await githubWebhookManager.createWebhook(123, config);

      expect(result).toEqual(existingWebhook);
      expect(mockFetch).not.toHaveBeenCalled();
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('should use existing webhook if GitHub returns 422 (already exists)', async () => {
      const mockToken = { token_value: 'test-token' };
      const existingGitHubWebhook = { id: 12345 };
      const mockSavedWebhook = {
        id: 1,
        user_id: 123,
        service: 'github',
        external_id: '12345',
        repository: 'owner/repo',
        url: 'https://example.com/api/webhooks/github',
        secret: 'test-webhook-secret',
        events: ['push'],
        is_active: true,
      };

      mockGetUserToken.mockResolvedValue(mockToken);
      mockRepository.find.mockResolvedValue([]);
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 422,
          text: () => Promise.resolve('Webhook already exists'),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve([
              {
                id: 12345,
                config: { url: 'https://example.com/api/webhooks/github' },
                events: ['push'],
                active: true,
              },
            ]),
        });
      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.save.mockResolvedValue(mockSavedWebhook);

      const {
        githubWebhookManager,
      } = require('../../../src/services/services/github/webhookManager');

      const config = {
        repository: 'owner/repo',
        events: ['push'],
      };

      const result = await githubWebhookManager.createWebhook(123, config);

      expect(result).toEqual(mockSavedWebhook);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should use existing database record if webhook already exists in DB', async () => {
      const mockToken = { token_value: 'test-token' };
      const mockGitHubResponse = { id: 12345 };
      const existingDbWebhook = {
        id: 1,
        user_id: 123,
        service: 'github',
        external_id: '12345',
        repository: 'owner/repo',
        url: 'https://example.com/api/webhooks/github',
        secret: 'test-webhook-secret',
        events: ['push'],
        is_active: true,
      };

      mockGetUserToken.mockResolvedValue(mockToken);
      mockRepository.find.mockResolvedValue([]);
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockGitHubResponse),
      });
      mockRepository.findOne.mockResolvedValue(existingDbWebhook);

      const {
        githubWebhookManager,
      } = require('../../../src/services/services/github/webhookManager');

      const config = {
        repository: 'owner/repo',
        events: ['push'],
      };

      const result = await githubWebhookManager.createWebhook(123, config);

      expect(result).toEqual(existingDbWebhook);
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('should generate random secret if WEBHOOK_SECRET is not set', async () => {
      process.env.WEBHOOK_SECRET = '';

      const mockToken = { token_value: 'test-token' };
      const mockGitHubResponse = { id: 12345 };
      const mockSavedWebhook = {
        id: 1,
        user_id: 123,
        service: 'github',
        external_id: '12345',
        repository: 'owner/repo',
        url: 'https://example.com/api/webhooks/github',
        secret: '72616e646f6d2d7365637265742d33322d62797465732d6c6f6e67',
        events: ['push'],
        is_active: true,
      };

      mockGetUserToken.mockResolvedValue(mockToken);
      mockRepository.find.mockResolvedValue([]);
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockGitHubResponse),
      });
      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.save.mockResolvedValue(mockSavedWebhook);

      const {
        githubWebhookManager,
      } = require('../../../src/services/services/github/webhookManager');

      const config = {
        repository: 'owner/repo',
        events: ['push'],
      };

      await githubWebhookManager.createWebhook(123, config);

      expect(mockRandomBytes).toHaveBeenCalledWith(32);
    });

    it('should throw error if token not found', async () => {
      mockGetUserToken.mockResolvedValue(null);

      const {
        githubWebhookManager,
      } = require('../../../src/services/services/github/webhookManager');

      const config = {
        repository: 'owner/repo',
        events: ['push'],
      };

      await expect(
        githubWebhookManager.createWebhook(123, config)
      ).rejects.toThrow('GitHub token not found for user');
    });

    it('should throw error if GitHub API fails with non-422 error', async () => {
      const mockToken = { token_value: 'test-token' };

      mockGetUserToken.mockResolvedValue(mockToken);
      mockRepository.find.mockResolvedValue([]);
      mockFetch.mockResolvedValue({
        ok: false,
        status: 403,
        text: () => Promise.resolve('Forbidden'),
      });

      const {
        githubWebhookManager,
      } = require('../../../src/services/services/github/webhookManager');

      const config = {
        repository: 'owner/repo',
        events: ['push'],
      };

      await expect(
        githubWebhookManager.createWebhook(123, config)
      ).rejects.toThrow('Failed to create GitHub webhook: Forbidden');
    });
  });

  describe('deleteWebhook', () => {
    it('should delete webhook successfully', async () => {
      const mockToken = { token_value: 'test-token' };
      const mockWebhook = {
        id: 1,
        user_id: 123,
        service: 'github',
        external_id: '12345',
        repository: 'owner/repo',
      };

      mockRepository.findOne.mockResolvedValue(mockWebhook);
      mockGetUserToken.mockResolvedValue(mockToken);
      mockFetch.mockResolvedValue({
        ok: true,
      });

      const {
        githubWebhookManager,
      } = require('../../../src/services/services/github/webhookManager');

      await githubWebhookManager.deleteWebhook(123, 1);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: {
          id: 1,
          user_id: 123,
          service: 'github',
        },
      });
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.github.com/repos/owner/repo/hooks/12345',
        expect.objectContaining({
          method: 'DELETE',
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
          }),
        })
      );
      expect(mockRepository.remove).toHaveBeenCalledWith(mockWebhook);
    });

    it('should delete webhook even if GitHub deletion fails with 404', async () => {
      const mockToken = { token_value: 'test-token' };
      const mockWebhook = {
        id: 1,
        user_id: 123,
        service: 'github',
        external_id: '12345',
        repository: 'owner/repo',
      };

      mockRepository.findOne.mockResolvedValue(mockWebhook);
      mockGetUserToken.mockResolvedValue(mockToken);
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
      });

      const {
        githubWebhookManager,
      } = require('../../../src/services/services/github/webhookManager');

      await githubWebhookManager.deleteWebhook(123, 1);

      expect(mockRepository.remove).toHaveBeenCalledWith(mockWebhook);
    });

    it('should throw error if webhook not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const {
        githubWebhookManager,
      } = require('../../../src/services/services/github/webhookManager');

      await expect(githubWebhookManager.deleteWebhook(123, 1)).rejects.toThrow(
        'Webhook not found'
      );
    });

    it('should throw error if token not found', async () => {
      const mockWebhook = {
        id: 1,
        user_id: 123,
        service: 'github',
        external_id: '12345',
        repository: 'owner/repo',
      };

      mockRepository.findOne.mockResolvedValue(mockWebhook);
      mockGetUserToken.mockResolvedValue(null);

      const {
        githubWebhookManager,
      } = require('../../../src/services/services/github/webhookManager');

      await expect(githubWebhookManager.deleteWebhook(123, 1)).rejects.toThrow(
        'GitHub token not found for user'
      );
    });
  });

  describe('getUserWebhooks', () => {
    it('should return user webhooks ordered by created_at DESC', async () => {
      const mockWebhooks = [
        { id: 1, created_at: new Date('2023-01-02') },
        { id: 2, created_at: new Date('2023-01-01') },
      ];

      mockRepository.find.mockResolvedValue(mockWebhooks);

      const {
        githubWebhookManager,
      } = require('../../../src/services/services/github/webhookManager');

      const result = await githubWebhookManager.getUserWebhooks(123);

      expect(result).toEqual(mockWebhooks);
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: {
          user_id: 123,
          service: 'github',
        },
        order: {
          created_at: 'DESC',
        },
      });
    });
  });

  describe('updateWebhook', () => {
    it('should update webhook successfully', async () => {
      const mockToken = { token_value: 'test-token' };
      const mockWebhook = {
        id: 1,
        user_id: 123,
        service: 'github',
        external_id: '12345',
        repository: 'owner/repo',
        events: ['push'],
        is_active: true,
        updated_at: new Date(),
      };
      const updatedWebhook = {
        ...mockWebhook,
        events: ['push', 'pull_request'],
      };

      mockRepository.findOne.mockResolvedValue(mockWebhook);
      mockGetUserToken.mockResolvedValue(mockToken);
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      });
      mockRepository.save.mockResolvedValue(updatedWebhook);

      const {
        githubWebhookManager,
      } = require('../../../src/services/services/github/webhookManager');

      const updates = {
        events: ['push', 'pull_request'],
        secret: 'new-secret',
      };

      const result = await githubWebhookManager.updateWebhook(123, 1, updates);

      expect(result).toEqual(updatedWebhook);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.github.com/repos/owner/repo/hooks/12345',
        expect.objectContaining({
          method: 'PATCH',
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify({
            active: true,
            events: ['push', 'pull_request'],
            config: {
              secret: 'new-secret',
            },
          }),
        })
      );
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should throw error if webhook not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const {
        githubWebhookManager,
      } = require('../../../src/services/services/github/webhookManager');

      await expect(
        githubWebhookManager.updateWebhook(123, 1, {})
      ).rejects.toThrow('Webhook not found');
    });

    it('should throw error if token not found', async () => {
      const mockWebhook = {
        id: 1,
        user_id: 123,
        service: 'github',
        external_id: '12345',
        repository: 'owner/repo',
      };

      mockRepository.findOne.mockResolvedValue(mockWebhook);
      mockGetUserToken.mockResolvedValue(null);

      const {
        githubWebhookManager,
      } = require('../../../src/services/services/github/webhookManager');

      await expect(
        githubWebhookManager.updateWebhook(123, 1, {})
      ).rejects.toThrow('GitHub token not found for user');
    });

    it('should throw error if GitHub API update fails', async () => {
      const mockToken = { token_value: 'test-token' };
      const mockWebhook = {
        id: 1,
        user_id: 123,
        service: 'github',
        external_id: '12345',
        repository: 'owner/repo',
      };

      mockRepository.findOne.mockResolvedValue(mockWebhook);
      mockGetUserToken.mockResolvedValue(mockToken);
      mockFetch.mockResolvedValue({
        ok: false,
        text: () => Promise.resolve('Update failed'),
      });

      const {
        githubWebhookManager,
      } = require('../../../src/services/services/github/webhookManager');

      await expect(
        githubWebhookManager.updateWebhook(123, 1, { events: ['push'] })
      ).rejects.toThrow('Failed to update GitHub webhook: Update failed');
    });
  });

  describe('private methods', () => {
    describe('findExistingWebhook', () => {
      it('should find existing webhook by URL', async () => {
        const mockWebhooks = [
          {
            id: 12345,
            config: { url: 'https://example.com/api/webhooks/github' },
            events: ['push'],
            active: true,
          },
        ];

        mockFetch.mockResolvedValue({
          ok: true,
          json: () => Promise.resolve(mockWebhooks),
        });

        const {
          githubWebhookManager,
        } = require('../../../src/services/services/github/webhookManager');

        const result = await (githubWebhookManager as any).findExistingWebhook(
          'test-token',
          'owner/repo',
          'https://example.com/api/webhooks/github'
        );

        expect(result).toEqual({ id: 12345 });
      });

      it('should return null if webhook not found', async () => {
        mockFetch.mockResolvedValue({
          ok: true,
          json: () => Promise.resolve([]),
        });

        const {
          githubWebhookManager,
        } = require('../../../src/services/services/github/webhookManager');

        const result = await (githubWebhookManager as any).findExistingWebhook(
          'test-token',
          'owner/repo',
          'https://example.com/api/webhooks/github'
        );

        expect(result).toBeNull();
      });

      it('should return null if API call fails', async () => {
        mockFetch.mockRejectedValue(new Error('API error'));

        const {
          githubWebhookManager,
        } = require('../../../src/services/services/github/webhookManager');

        const result = await (githubWebhookManager as any).findExistingWebhook(
          'test-token',
          'owner/repo',
          'https://example.com/api/webhooks/github'
        );

        expect(result).toBeNull();
      });
    });

    describe('generateWebhookUrl', () => {
      it('should generate webhook URL with base URL', () => {
        const {
          githubWebhookManager,
        } = require('../../../src/services/services/github/webhookManager');

        const result = (githubWebhookManager as any).generateWebhookUrl();

        expect(result).toBe('https://example.com/api/webhooks/github');
      });

      it('should handle missing WEBHOOK_BASE_URL', () => {
        delete process.env.WEBHOOK_BASE_URL;

        const {
          githubWebhookManager,
        } = require('../../../src/services/services/github/webhookManager');

        const result = (githubWebhookManager as any).generateWebhookUrl();

        expect(result).toBe('/api/webhooks/github');
      });
    });

    describe('getDefaultSecret', () => {
      it('should return env secret if set', () => {
        const {
          githubWebhookManager,
        } = require('../../../src/services/services/github/webhookManager');

        const result = (githubWebhookManager as any).getDefaultSecret();

        expect(result).toBe('test-webhook-secret');
      });

      it('should generate random secret if env secret not set', () => {
        process.env.WEBHOOK_SECRET = '';

        const {
          githubWebhookManager,
        } = require('../../../src/services/services/github/webhookManager');

        const result = (githubWebhookManager as any).getDefaultSecret();

        expect(result).toBe(
          '72616e646f6d2d7365637265742d33322d62797465732d6c6f6e67'
        );
        expect(mockRandomBytes).toHaveBeenCalledWith(32);
      });
    });

    describe('arraysEqual', () => {
      it('should return true for equal arrays', () => {
        const {
          githubWebhookManager,
        } = require('../../../src/services/services/github/webhookManager');

        const result = (githubWebhookManager as any).arraysEqual(
          ['a', 'b'],
          ['a', 'b']
        );

        expect(result).toBe(true);
      });

      it('should return false for different arrays', () => {
        const {
          githubWebhookManager,
        } = require('../../../src/services/services/github/webhookManager');

        const result = (githubWebhookManager as any).arraysEqual(
          ['a', 'b'],
          ['a', 'c']
        );

        expect(result).toBe(false);
      });

      it('should return false for arrays with different lengths', () => {
        const {
          githubWebhookManager,
        } = require('../../../src/services/services/github/webhookManager');

        const result = (githubWebhookManager as any).arraysEqual(
          ['a', 'b'],
          ['a']
        );

        expect(result).toBe(false);
      });
    });
  });
});
