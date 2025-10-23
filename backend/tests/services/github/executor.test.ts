import { jest } from '@jest/globals';

// Mock global fetch
const mockFetch = jest.fn() as any;
global.fetch = mockFetch;

describe('GitHubReactionExecutor', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    process.env.SERVICE_GITHUB_API_BASE_URL = 'https://api.github.com';
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('execute', () => {
    it('should execute create_issue reaction successfully', async () => {
      const mockIssueResponse = {
        id: 12345,
        number: 1,
        title: 'Test Issue',
        body: 'Test body',
        html_url: 'https://github.com/owner/repo/issues/1',
        state: 'open',
        labels: [{ name: 'bug' }],
        assignees: [{ login: 'testuser' }],
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockIssueResponse),
      });

      const {
        githubReactionExecutor,
      } = require('../../../src/services/services/github/executor');

      const context = {
        reaction: {
          type: 'github.create_issue',
          config: {
            repository: 'owner/repo',
            title: 'Test Issue',
            body: 'Test body',
            labels: 'bug,urgent',
            assignees: 'testuser,anotheruser',
          },
        },
        serviceConfig: {
          credentials: {
            access_token: 'test-token',
          },
        },
      };

      const result = await githubReactionExecutor.execute(context);

      expect(result.success).toBe(true);
      expect(result.output).toEqual({
        issue: {
          id: 12345,
          number: 1,
          title: 'Test Issue',
          body: 'Test body',
          html_url: 'https://github.com/owner/repo/issues/1',
          state: 'open',
          labels: ['bug'],
          assignees: ['testuser'],
        },
      });
      expect(result.metadata).toEqual({
        repository: 'owner/repo',
        issue_number: 1,
        issue_url: 'https://github.com/owner/repo/issues/1',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.github.com/repos/owner/repo/issues',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
            'Content-Type': 'application/json',
            Accept: 'application/vnd.github.v3+json',
            'User-Agent': 'AREA-App',
          }),
          body: JSON.stringify({
            title: 'Test Issue',
            body: 'Test body',
            labels: ['bug', 'urgent'],
            assignees: ['testuser', 'anotheruser'],
          }),
        })
      );
    });

    it('should execute add_comment reaction successfully', async () => {
      const mockCommentResponse = {
        id: 12345,
        body: 'Test comment',
        html_url: 'https://github.com/owner/repo/issues/1#issuecomment-12345',
        user: {
          login: 'testuser',
          id: 123,
        },
        created_at: '2023-01-01T00:00:00Z',
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockCommentResponse),
      });

      const {
        githubReactionExecutor,
      } = require('../../../src/services/services/github/executor');

      const context = {
        reaction: {
          type: 'github.add_comment',
          config: {
            repository: 'owner/repo',
            issue_number: 1,
            body: 'Test comment',
          },
        },
        serviceConfig: {
          credentials: {
            access_token: 'test-token',
          },
        },
      };

      const result = await githubReactionExecutor.execute(context);

      expect(result.success).toBe(true);
      expect(result.output).toEqual({
        comment: {
          id: 12345,
          body: 'Test comment',
          html_url: 'https://github.com/owner/repo/issues/1#issuecomment-12345',
          user: {
            login: 'testuser',
            id: 123,
          },
          created_at: '2023-01-01T00:00:00Z',
        },
      });
      expect(result.metadata).toEqual({
        repository: 'owner/repo',
        issue_number: 1,
        comment_id: 12345,
        comment_url:
          'https://github.com/owner/repo/issues/1#issuecomment-12345',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.github.com/repos/owner/repo/issues/1/comments',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
            'Content-Type': 'application/json',
            Accept: 'application/vnd.github.v3+json',
            'User-Agent': 'AREA-App',
          }),
          body: JSON.stringify({ body: 'Test comment' }),
        })
      );
    });

    it('should handle unknown reaction type', async () => {
      const {
        githubReactionExecutor,
      } = require('../../../src/services/services/github/executor');

      const context = {
        reaction: {
          type: 'github.unknown_reaction',
          config: {},
        },
        serviceConfig: {
          credentials: {
            access_token: 'test-token',
          },
        },
      };

      const result = await githubReactionExecutor.execute(context);

      expect(result.success).toBe(false);
      expect(result.error).toBe(
        'Unknown reaction type: github.unknown_reaction'
      );
    });

    it('should handle missing access token', async () => {
      const {
        githubReactionExecutor,
      } = require('../../../src/services/services/github/executor');

      const context = {
        reaction: {
          type: 'github.create_issue',
          config: {
            repository: 'owner/repo',
            title: 'Test Issue',
          },
        },
        serviceConfig: {
          credentials: {},
        },
      };

      const result = await githubReactionExecutor.execute(context);

      expect(result.success).toBe(false);
      expect(result.error).toBe('GitHub access token not configured');
    });

    it('should handle create_issue with missing required fields', async () => {
      const {
        githubReactionExecutor,
      } = require('../../../src/services/services/github/executor');

      const context = {
        reaction: {
          type: 'github.create_issue',
          config: {
            // missing repository and title
          },
        },
        serviceConfig: {
          credentials: {
            access_token: 'test-token',
          },
        },
      };

      const result = await githubReactionExecutor.execute(context);

      expect(result.success).toBe(false);
      expect(result.error).toBe(
        'Repository and title are required for creating an issue'
      );
    });

    it('should handle create_issue with invalid repository format', async () => {
      const {
        githubReactionExecutor,
      } = require('../../../src/services/services/github/executor');

      const context = {
        reaction: {
          type: 'github.create_issue',
          config: {
            repository: 'invalid-repo-format',
            title: 'Test Issue',
          },
        },
        serviceConfig: {
          credentials: {
            access_token: 'test-token',
          },
        },
      };

      const result = await githubReactionExecutor.execute(context);

      expect(result.success).toBe(false);
      expect(result.error).toBe(
        'Invalid repository format. Expected: owner/repo'
      );
    });

    it('should handle add_comment with missing required fields', async () => {
      const {
        githubReactionExecutor,
      } = require('../../../src/services/services/github/executor');

      const context = {
        reaction: {
          type: 'github.add_comment',
          config: {
            repository: 'owner/repo',
            // missing issue_number and body
          },
        },
        serviceConfig: {
          credentials: {
            access_token: 'test-token',
          },
        },
      };

      const result = await githubReactionExecutor.execute(context);

      expect(result.success).toBe(false);
      expect(result.error).toBe(
        'Repository, issue_number, and body are required for adding a comment'
      );
    });

    it('should handle API errors for create_issue', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 422,
        statusText: 'Unprocessable Entity',
        json: () => Promise.resolve({ message: 'Validation failed' }),
      });

      const {
        githubReactionExecutor,
      } = require('../../../src/services/services/github/executor');

      const context = {
        reaction: {
          type: 'github.create_issue',
          config: {
            repository: 'owner/repo',
            title: 'Test Issue',
          },
        },
        serviceConfig: {
          credentials: {
            access_token: 'test-token',
          },
        },
      };

      const result = await githubReactionExecutor.execute(context);

      expect(result.success).toBe(false);
      expect(result.error).toContain(
        'GitHub API error: 422 Unprocessable Entity'
      );
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const {
        githubReactionExecutor,
      } = require('../../../src/services/services/github/executor');

      const context = {
        reaction: {
          type: 'github.create_issue',
          config: {
            repository: 'owner/repo',
            title: 'Test Issue',
          },
        },
        serviceConfig: {
          credentials: {
            access_token: 'test-token',
          },
        },
      };

      const result = await githubReactionExecutor.execute(context);

      expect(result.success).toBe(false);
      expect(result.error).toBe(
        'Network error while creating issue: Network error'
      );
    });
  });
});
