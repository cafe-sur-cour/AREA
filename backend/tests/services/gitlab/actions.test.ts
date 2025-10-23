import { jest } from '@jest/globals';

describe('GitLab Actions', () => {
  describe('gitlabActions', () => {
    it('should have correct number of actions', () => {
      const {
        gitlabActions,
      } = require('../../../src/services/services/gitlab/action');

      expect(gitlabActions).toHaveLength(4);
    });

    describe('gitlab.push action', () => {
      it('should have correct structure', () => {
        const {
          gitlabActions,
        } = require('../../../src/services/services/gitlab/action');

        const action = gitlabActions.find((a: any) => a.id === 'gitlab.push');

        expect(action).toEqual({
          id: 'gitlab.push',
          name: 'GitLab Push',
          description:
            'Triggers when a push event occurs on a selected repository',
          configSchema: expect.any(Object),
          inputSchema: {
            type: 'object',
            properties: {
              ref: {
                type: 'string',
                description: 'The full ref name that was pushed to',
              },
              before: {
                type: 'string',
                description: 'The SHA of the commit before the push',
              },
              after: {
                type: 'string',
                description: 'The SHA of the commit after the push',
              },
              user_id: {
                type: 'number',
                description: 'The ID of the user who pushed',
              },
              user_name: {
                type: 'string',
                description: 'The name of the user who pushed',
              },
              user_username: {
                type: 'string',
                description: 'The username of the user who pushed',
              },
              project: {
                type: 'object',
                description: 'Project information',
                properties: {
                  id: { type: 'number', description: 'Project ID' },
                  name: { type: 'string', description: 'Project name' },
                  path_with_namespace: {
                    type: 'string',
                    description: 'Full project path',
                  },
                  web_url: {
                    type: 'string',
                    description: 'Project web URL',
                  },
                },
              },
              commits: {
                type: 'array',
                description: 'Array of commits in the push',
                items: {
                  type: 'object',
                  description: 'Commit information',
                  properties: {
                    id: { type: 'string', description: 'Commit SHA' },
                    message: { type: 'string', description: 'Commit message' },
                    author: {
                      type: 'object',
                      description: 'Commit author information',
                      properties: {
                        name: { type: 'string', description: 'Author name' },
                        email: {
                          type: 'string',
                          description: 'Author email',
                        },
                      },
                    },
                    timestamp: {
                      type: 'string',
                      description: 'Commit timestamp',
                    },
                  },
                },
              },
              total_commits_count: {
                type: 'number',
                description: 'Total number of commits in the push',
              },
            },
            required: ['ref', 'before', 'after', 'user_id', 'project', 'commits'],
          },
          metadata: {
            category: 'GitLab',
            tags: ['repository', 'push', 'git'],
            requiresAuth: true,
            webhookPattern: 'Push Hook',
          },
        });
      });
    });

    describe('gitlab.merge_request_opened action', () => {
      it('should have correct structure', () => {
        const {
          gitlabActions,
        } = require('../../../src/services/services/gitlab/action');

        const action = gitlabActions.find(
          (a: any) => a.id === 'gitlab.merge_request_opened'
        );

        expect(action).toEqual({
          id: 'gitlab.merge_request_opened',
          name: 'GitLab Merge Request Opened',
          description: 'Triggers when a new merge request is opened',
          configSchema: expect.any(Object),
          inputSchema: {
            type: 'object',
            properties: {
              object_attributes: {
                type: 'object',
                description: 'Merge request attributes',
                properties: {
                  id: { type: 'number', description: 'Merge request ID' },
                  iid: {
                    type: 'number',
                    description: 'Internal merge request ID',
                  },
                  title: { type: 'string', description: 'Merge request title' },
                  description: {
                    type: 'string',
                    description: 'Merge request description',
                  },
                  state: {
                    type: 'string',
                    description: 'Merge request state',
                  },
                  target_branch: {
                    type: 'string',
                    description: 'Target branch',
                  },
                  source_branch: {
                    type: 'string',
                    description: 'Source branch',
                  },
                  web_url: {
                    type: 'string',
                    description: 'Merge request web URL',
                  },
                  author_id: { type: 'number', description: 'Author ID' },
                  assignee_ids: {
                    type: 'array',
                    description: 'Assignee IDs',
                    items: { type: 'number', description: 'Assignee ID' },
                  },
                  created_at: {
                    type: 'string',
                    description: 'Creation timestamp',
                  },
                  updated_at: {
                    type: 'string',
                    description: 'Last update timestamp',
                  },
                },
              },
              user: {
                type: 'object',
                description: 'User who opened the merge request',
                properties: {
                  id: { type: 'number', description: 'User ID' },
                  name: { type: 'string', description: 'User name' },
                  username: { type: 'string', description: 'Username' },
                },
              },
              project: {
                type: 'object',
                description: 'Project information',
                properties: {
                  id: { type: 'number', description: 'Project ID' },
                  name: { type: 'string', description: 'Project name' },
                  path_with_namespace: {
                    type: 'string',
                    description: 'Full project path',
                  },
                  web_url: {
                    type: 'string',
                    description: 'Project web URL',
                  },
                },
              },
            },
            required: ['object_attributes', 'user', 'project'],
          },
          metadata: {
            category: 'GitLab',
            tags: ['repository', 'merge-request', 'opened'],
            requiresAuth: true,
            webhookPattern: 'Merge Request Hook',
          },
        });
      });
    });

    describe('gitlab.merge_request_merged action', () => {
      it('should have correct structure', () => {
        const {
          gitlabActions,
        } = require('../../../src/services/services/gitlab/action');

        const action = gitlabActions.find(
          (a: any) => a.id === 'gitlab.merge_request_merged'
        );

        expect(action).toBeDefined();
        expect(action.id).toBe('gitlab.merge_request_merged');
        expect(action.name).toBe('GitLab Merge Request Merged');
        expect(action.metadata.webhookPattern).toBe('Merge Request Hook');
      });
    });

    describe('gitlab.issue_opened action', () => {
      it('should have correct structure', () => {
        const {
          gitlabActions,
        } = require('../../../src/services/services/gitlab/action');

        const action = gitlabActions.find(
          (a: any) => a.id === 'gitlab.issue_opened'
        );

        expect(action).toBeDefined();
        expect(action.id).toBe('gitlab.issue_opened');
        expect(action.name).toBe('GitLab Issue Opened');
        expect(action.metadata.webhookPattern).toBe('Issue Hook');
      });
    });
  });
});
