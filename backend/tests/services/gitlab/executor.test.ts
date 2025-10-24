import { jest } from '@jest/globals';

// Mock global fetch
const mockFetch = jest.fn() as any;
global.fetch = mockFetch;

describe('GitLabReactionExecutor', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    process.env.SERVICE_GITLAB_API_BASE_URL = 'https://gitlab.com/api/v4';
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('execute', () => {
    it('should execute create_issue reaction successfully', async () => {
      const mockIssueResponse = {
        id: 12345,
        iid: 1,
        title: 'Test Issue',
        description: 'Test description',
        state: 'opened',
        web_url: 'https://gitlab.com/group/project/-/issues/1',
        labels: [{ id: 1, name: 'bug', color: '#ff0000' }],
        assignees: [{ id: 1, name: 'Test User', username: 'testuser' }],
        author: { id: 1, name: 'Test User', username: 'testuser' },
        created_at: '2023-01-01T00:00:00Z',
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockIssueResponse),
      });

      const {
        gitlabReactionExecutor,
      } = require('../../../src/services/services/gitlab/executor');

      const context = {
        reaction: {
          type: 'gitlab.create_issue',
          config: {
            project: 'group/project',
            title: 'Test Issue',
            description: 'Test description',
            labels: 'bug',
            assignee_ids: '1,2',
          },
        },
        serviceConfig: {
          credentials: {
            access_token: 'test-token',
          },
        },
      };

      const result = await gitlabReactionExecutor.execute(context);

      expect(result.success).toBe(true);
      expect(result.output).toEqual({
        issue: {
          id: 12345,
          iid: 1,
          title: 'Test Issue',
          description: 'Test description',
          state: 'opened',
          web_url: 'https://gitlab.com/group/project/-/issues/1',
          labels: [{ id: 1, name: 'bug', color: '#ff0000' }],
          assignees: [{ id: 1, name: 'Test User', username: 'testuser' }],
          author: { id: 1, name: 'Test User', username: 'testuser' },
          created_at: '2023-01-01T00:00:00Z',
        },
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://gitlab.com/api/v4/projects/group%2Fproject/issues',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
            'Content-Type': 'application/json',
            Accept: 'application/json',
            'User-Agent': 'AREA-App',
          }),
        })
      );
    });

    it('should execute add_comment reaction successfully', async () => {
      const mockCommentResponse = {
        id: 12345,
        body: 'Test comment',
        author: {
          id: 1,
          name: 'Test User',
          username: 'testuser',
        },
        created_at: '2023-01-01T00:00:00Z',
        system: false,
        noteable_type: 'Issue',
        noteable_id: 1,
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockCommentResponse),
      });

      const {
        gitlabReactionExecutor,
      } = require('../../../src/services/services/gitlab/executor');

      const context = {
        reaction: {
          type: 'gitlab.add_comment',
          config: {
            project: 'group/project',
            issue_iid: '1',
            note_type: 'issue',
            body: 'Test comment',
          },
        },
        serviceConfig: {
          credentials: {
            access_token: 'test-token',
          },
        },
      };

      const result = await gitlabReactionExecutor.execute(context);

      expect(result.success).toBe(true);
      expect(result.output).toEqual({
        note: {
          id: 12345,
          body: 'Test comment',
          author: {
            id: 1,
            name: 'Test User',
            username: 'testuser',
          },
          created_at: '2023-01-01T00:00:00Z',
          system: false,
          noteable_type: 'Issue',
          noteable_id: 1,
        },
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://gitlab.com/api/v4/projects/group%2Fproject/issues/1/notes',
        expect.objectContaining({
          method: 'POST',
        })
      );
    });

    it('should return error when access token is not provided', async () => {
      const {
        gitlabReactionExecutor,
      } = require('../../../src/services/services/gitlab/executor');

      const context = {
        reaction: {
          type: 'gitlab.create_issue',
          config: {
            project: 'group/project',
            title: 'Test Issue',
          },
        },
        serviceConfig: {
          credentials: {},
        },
      };

      const result = await gitlabReactionExecutor.execute(context);

      expect(result.success).toBe(false);
      expect(result.error).toBe('GitLab access token not configured');
    });

    it('should handle unknown reaction type', async () => {
      const {
        gitlabReactionExecutor,
      } = require('../../../src/services/services/gitlab/executor');

      const context = {
        reaction: {
          type: 'gitlab.unknown_action',
          config: {},
        },
        serviceConfig: {
          credentials: {
            access_token: 'test-token',
          },
        },
      };

      const result = await gitlabReactionExecutor.execute(context);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unknown reaction type');
    });

    it('should handle API errors gracefully', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: () => Promise.resolve({ message: 'Invalid parameters' }),
      });

      const {
        gitlabReactionExecutor,
      } = require('../../../src/services/services/gitlab/executor');

      const context = {
        reaction: {
          type: 'gitlab.create_issue',
          config: {
            project: 'group/project',
            title: 'Test Issue',
          },
        },
        serviceConfig: {
          credentials: {
            access_token: 'test-token',
          },
        },
      };

      const result = await gitlabReactionExecutor.execute(context);

      expect(result.success).toBe(false);
      expect(result.error).toContain('GitLab API error');
    });

    it('should return error when required fields are missing', async () => {
      const {
        gitlabReactionExecutor,
      } = require('../../../src/services/services/gitlab/executor');

      const context = {
        reaction: {
          type: 'gitlab.create_issue',
          config: {
            // Missing project and title
            description: 'Test description',
          },
        },
        serviceConfig: {
          credentials: {
            access_token: 'test-token',
          },
        },
      };

      const result = await gitlabReactionExecutor.execute(context);

      expect(result.success).toBe(false);
      expect(result.error).toContain('required');
    });

    it('should execute create_merge_request reaction successfully', async () => {
      const mockMRResponse = {
        id: 54321,
        iid: 2,
        title: 'Feature: New feature',
        description: 'This is a feature MR',
        state: 'opened',
        web_url: 'https://gitlab.com/group/project/-/merge_requests/2',
        source_branch: 'feature-branch',
        target_branch: 'main',
        author: { id: 1, name: 'Test User', username: 'testuser' },
        assignees: [],
        created_at: '2023-01-01T00:00:00Z',
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockMRResponse),
      });

      const {
        gitlabReactionExecutor,
      } = require('../../../src/services/services/gitlab/executor');

      const context = {
        reaction: {
          type: 'gitlab.create_merge_request',
          config: {
            project: 'group/project',
            title: 'Feature: New feature',
            description: 'This is a feature MR',
            source_branch: 'feature-branch',
            target_branch: 'main',
            assignee_ids: '1,2',
          },
        },
        serviceConfig: {
          credentials: {
            access_token: 'test-token',
          },
        },
      };

      const result = await gitlabReactionExecutor.execute(context);

      expect(result.success).toBe(true);
      expect(result.output.merge_request).toBeDefined();
      expect(result.output.merge_request.id).toBe(54321);
      expect(result.output.merge_request.title).toBe('Feature: New feature');
      expect(result.output.merge_request.source_branch).toBe('feature-branch');
      expect(result.output.merge_request.target_branch).toBe('main');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://gitlab.com/api/v4/projects/group%2Fproject/merge_requests',
        expect.objectContaining({
          method: 'POST',
        })
      );
    });

    it('should return error when merge request required fields are missing', async () => {
      const {
        gitlabReactionExecutor,
      } = require('../../../src/services/services/gitlab/executor');

      const context = {
        reaction: {
          type: 'gitlab.create_merge_request',
          config: {
            project: 'group/project',
            title: 'Feature: New feature',
            // Missing source_branch and target_branch
          },
        },
        serviceConfig: {
          credentials: {
            access_token: 'test-token',
          },
        },
      };

      const result = await gitlabReactionExecutor.execute(context);

      expect(result.success).toBe(false);
      expect(result.error).toContain('required');
    });

    it('should execute set_project_visibility reaction successfully', async () => {
      const mockProjectResponse = {
        id: 456,
        name: 'my-project',
        path: 'my-project',
        path_with_namespace: 'group/my-project',
        visibility: 'public',
        web_url: 'https://gitlab.com/group/my-project',
        description: 'A test project',
        updated_at: '2023-01-01T00:00:00Z',
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockProjectResponse),
      });

      const {
        gitlabReactionExecutor,
      } = require('../../../src/services/services/gitlab/executor');

      const context = {
        reaction: {
          type: 'gitlab.set_project_visibility',
          config: {
            project: 'group/my-project',
            visibility: 'public',
          },
        },
        serviceConfig: {
          credentials: {
            access_token: 'test-token',
          },
        },
      };

      const result = await gitlabReactionExecutor.execute(context);

      expect(result.success).toBe(true);
      expect(result.output.project).toBeDefined();
      expect(result.output.project.visibility).toBe('public');
      expect(result.output.project.path_with_namespace).toBe(
        'group/my-project'
      );

      expect(mockFetch).toHaveBeenCalledWith(
        'https://gitlab.com/api/v4/projects/group%2Fmy-project',
        expect.objectContaining({
          method: 'PUT',
        })
      );
    });

    it('should return error for invalid project visibility', async () => {
      const {
        gitlabReactionExecutor,
      } = require('../../../src/services/services/gitlab/executor');

      const context = {
        reaction: {
          type: 'gitlab.set_project_visibility',
          config: {
            project: 'group/project',
            visibility: 'invalid-visibility',
          },
        },
        serviceConfig: {
          credentials: {
            access_token: 'test-token',
          },
        },
      };

      const result = await gitlabReactionExecutor.execute(context);

      expect(result.success).toBe(false);
      expect(result.error).toContain('private, internal, public');
    });

    it('should return error when visibility required fields are missing', async () => {
      const {
        gitlabReactionExecutor,
      } = require('../../../src/services/services/gitlab/executor');

      const context = {
        reaction: {
          type: 'gitlab.set_project_visibility',
          config: {
            // Missing project and visibility
          },
        },
        serviceConfig: {
          credentials: {
            access_token: 'test-token',
          },
        },
      };

      const result = await gitlabReactionExecutor.execute(context);

      expect(result.success).toBe(false);
      expect(result.error).toContain('required');
    });

    it('should handle network errors gracefully', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const {
        gitlabReactionExecutor,
      } = require('../../../src/services/services/gitlab/executor');

      const context = {
        reaction: {
          type: 'gitlab.create_issue',
          config: {
            project: 'group/project',
            title: 'Test Issue',
          },
        },
        serviceConfig: {
          credentials: {
            access_token: 'test-token',
          },
        },
      };

      const result = await gitlabReactionExecutor.execute(context);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to create GitLab issue');
    });

    it('should handle merge request network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network timeout'));

      const {
        gitlabReactionExecutor,
      } = require('../../../src/services/services/gitlab/executor');

      const context = {
        reaction: {
          type: 'gitlab.create_merge_request',
          config: {
            project: 'group/project',
            title: 'Test MR',
            source_branch: 'feature',
            target_branch: 'main',
          },
        },
        serviceConfig: {
          credentials: {
            access_token: 'test-token',
          },
        },
      };

      const result = await gitlabReactionExecutor.execute(context);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to create GitLab merge request');
    });

    it('should handle add_comment network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Connection refused'));

      const {
        gitlabReactionExecutor,
      } = require('../../../src/services/services/gitlab/executor');

      const context = {
        reaction: {
          type: 'gitlab.add_comment',
          config: {
            project: 'group/project',
            issue_iid: '1',
            note_type: 'issue',
            body: 'Test comment',
          },
        },
        serviceConfig: {
          credentials: {
            access_token: 'test-token',
          },
        },
      };

      const result = await gitlabReactionExecutor.execute(context);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to add GitLab comment');
    });

    it('should handle project visibility network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Server error'));

      const {
        gitlabReactionExecutor,
      } = require('../../../src/services/services/gitlab/executor');

      const context = {
        reaction: {
          type: 'gitlab.set_project_visibility',
          config: {
            project: 'group/project',
            visibility: 'public',
          },
        },
        serviceConfig: {
          credentials: {
            access_token: 'test-token',
          },
        },
      };

      const result = await gitlabReactionExecutor.execute(context);

      expect(result.success).toBe(false);
      expect(result.error).toContain(
        'Failed to update GitLab project visibility'
      );
    });

    it('should handle merge_request note_type in add_comment', async () => {
      const mockCommentResponse = {
        id: 12345,
        body: 'Test MR comment',
        author: {
          id: 1,
          name: 'Test User',
          username: 'testuser',
        },
        created_at: '2023-01-01T00:00:00Z',
        system: false,
        noteable_type: 'MergeRequest',
        noteable_id: 1,
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockCommentResponse),
      });

      const {
        gitlabReactionExecutor,
      } = require('../../../src/services/services/gitlab/executor');

      const context = {
        reaction: {
          type: 'gitlab.add_comment',
          config: {
            project: 'group/project',
            issue_iid: '5',
            note_type: 'merge_request',
            body: 'Test MR comment',
          },
        },
        serviceConfig: {
          credentials: {
            access_token: 'test-token',
          },
        },
      };

      const result = await gitlabReactionExecutor.execute(context);

      expect(result.success).toBe(true);
      expect(result.output.note).toBeDefined();

      expect(mockFetch).toHaveBeenCalledWith(
        'https://gitlab.com/api/v4/projects/group%2Fproject/merge_requests/5/notes',
        expect.objectContaining({
          method: 'POST',
        })
      );
    });

    it('should return error when add_comment required fields are missing', async () => {
      const {
        gitlabReactionExecutor,
      } = require('../../../src/services/services/gitlab/executor');

      const context = {
        reaction: {
          type: 'gitlab.add_comment',
          config: {
            project: 'group/project',
            // Missing issue_iid, note_type, and body
          },
        },
        serviceConfig: {
          credentials: {
            access_token: 'test-token',
          },
        },
      };

      const result = await gitlabReactionExecutor.execute(context);

      expect(result.success).toBe(false);
      expect(result.error).toContain('required');
    });
  });
});
