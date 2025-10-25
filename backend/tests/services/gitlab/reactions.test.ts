import { jest } from '@jest/globals';

describe('GitLab Reactions', () => {
  describe('gitlabReactions', () => {
    it('should have correct number of reactions', () => {
      const {
        gitlabReactions,
      } = require('../../../src/services/services/gitlab/reactions');

      expect(gitlabReactions).toHaveLength(4);
    });

    describe('gitlab.create_issue reaction', () => {
      it('should have correct structure', () => {
        const {
          gitlabReactions,
        } = require('../../../src/services/services/gitlab/reactions');

        const reaction = gitlabReactions.find(
          (r: any) => r.id === 'gitlab.create_issue'
        );

        expect(reaction).toEqual({
          id: 'gitlab.create_issue',
          name: 'Create GitLab Issue',
          description: 'Creates a new issue in the specified project',
          configSchema: expect.any(Object),
          outputSchema: {
            type: 'object',
            properties: {
              issue: {
                type: 'object',
                description: 'The created issue details',
                properties: {
                  id: { type: 'number', description: 'Issue ID' },
                  iid: { type: 'number', description: 'Internal issue ID' },
                  title: { type: 'string', description: 'Issue title' },
                  description: {
                    type: 'string',
                    description: 'Issue description',
                  },
                  state: { type: 'string', description: 'Issue state' },
                  web_url: { type: 'string', description: 'Issue web URL' },
                  labels: {
                    type: 'array',
                    description: 'Issue labels',
                    items: {
                      type: 'object',
                      description: 'Label information',
                      properties: {
                        id: { type: 'number', description: 'Label ID' },
                        name: { type: 'string', description: 'Label name' },
                        color: { type: 'string', description: 'Label color' },
                      },
                    },
                  },
                  assignees: {
                    type: 'array',
                    description: 'Issue assignees',
                    items: {
                      type: 'object',
                      description: 'Assignee information',
                      properties: {
                        id: { type: 'number', description: 'User ID' },
                        name: { type: 'string', description: 'User name' },
                        username: { type: 'string', description: 'Username' },
                      },
                    },
                  },
                  author: {
                    type: 'object',
                    description: 'Issue author',
                    properties: {
                      id: { type: 'number', description: 'User ID' },
                      name: { type: 'string', description: 'User name' },
                      username: { type: 'string', description: 'Username' },
                    },
                  },
                  created_at: {
                    type: 'string',
                    description: 'Creation timestamp',
                  },
                },
              },
            },
            required: ['issue'],
          },
          metadata: {
            category: 'GitLab',
            tags: ['repository', 'issue', 'create'],
            requiresAuth: true,
            estimatedDuration: 2000,
          },
        });
      });
    });

    describe('gitlab.add_comment reaction', () => {
      it('should have correct structure', () => {
        const {
          gitlabReactions,
        } = require('../../../src/services/services/gitlab/reactions');

        const reaction = gitlabReactions.find(
          (r: any) => r.id === 'gitlab.add_comment'
        );

        expect(reaction).toEqual({
          id: 'gitlab.add_comment',
          name: 'Add GitLab Comment',
          description: 'Adds a comment to an issue or merge request',
          configSchema: expect.any(Object),
          outputSchema: {
            type: 'object',
            properties: {
              note: {
                type: 'object',
                description: 'The created comment details',
                properties: {
                  id: { type: 'number', description: 'Note ID' },
                  body: { type: 'string', description: 'Note content' },
                  author: {
                    type: 'object',
                    description: 'Note author',
                    properties: {
                      id: { type: 'number', description: 'User ID' },
                      name: { type: 'string', description: 'User name' },
                      username: { type: 'string', description: 'Username' },
                    },
                  },
                  created_at: {
                    type: 'string',
                    description: 'Creation timestamp',
                  },
                  system: {
                    type: 'boolean',
                    description: 'Whether this is a system note',
                  },
                  noteable_type: {
                    type: 'string',
                    description: 'Type of object the note is on',
                  },
                  noteable_id: {
                    type: 'number',
                    description: 'ID of the object the note is on',
                  },
                },
              },
            },
            required: ['note'],
          },
          metadata: {
            category: 'GitLab',
            tags: ['repository', 'comment', 'issue', 'merge-request'],
            requiresAuth: true,
            estimatedDuration: 1500,
          },
        });
      });
    });

    describe('gitlab.create_merge_request reaction', () => {
      it('should have correct structure', () => {
        const {
          gitlabReactions,
        } = require('../../../src/services/services/gitlab/reactions');

        const reaction = gitlabReactions.find(
          (r: any) => r.id === 'gitlab.create_merge_request'
        );

        expect(reaction).toBeDefined();
        expect(reaction.id).toBe('gitlab.create_merge_request');
        expect(reaction.name).toBe('Create GitLab Merge Request');
        expect(reaction.metadata.tags).toContain('merge-request');
      });
    });

    describe('gitlab.set_project_visibility reaction', () => {
      it('should have correct structure', () => {
        const {
          gitlabReactions,
        } = require('../../../src/services/services/gitlab/reactions');

        const reaction = gitlabReactions.find(
          (r: any) => r.id === 'gitlab.set_project_visibility'
        );

        expect(reaction).toBeDefined();
        expect(reaction.id).toBe('gitlab.set_project_visibility');
        expect(reaction.name).toBe('Set GitLab Project Visibility');
        expect(reaction.metadata.tags).toContain('visibility');
      });
    });
  });
});
