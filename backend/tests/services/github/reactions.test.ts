import { jest } from '@jest/globals';

describe('GitHub Reactions', () => {
  describe('githubReactions', () => {
    it('should have correct number of reactions', () => {
      const {
        githubReactions,
      } = require('../../../src/services/services/github/reactions');

      expect(githubReactions).toHaveLength(2);
    });

    describe('github.create_issue reaction', () => {
      it('should have correct structure', () => {
        const {
          githubReactions,
        } = require('../../../src/services/services/github/reactions');

        const reaction = githubReactions.find(
          (r: any) => r.id === 'github.create_issue'
        );

        expect(reaction).toEqual({
          id: 'github.create_issue',
          name: 'Create GitHub Issue',
          description: 'Creates a new issue in the specified repository',
          configSchema: expect.any(Object),
          outputSchema: {
            type: 'object',
            properties: {
              issue: {
                type: 'object',
                description: 'The created issue details',
                properties: {
                  id: { type: 'number', description: 'Issue ID' },
                  number: { type: 'number', description: 'Issue number' },
                  title: { type: 'string', description: 'Issue title' },
                  body: { type: 'string', description: 'Issue body' },
                  html_url: { type: 'string', description: 'Issue URL' },
                  state: { type: 'string', description: 'Issue state' },
                  labels: {
                    type: 'array',
                    description: 'Issue labels',
                    items: { type: 'string', description: 'Label name' },
                  },
                  assignees: {
                    type: 'array',
                    description: 'Issue assignees',
                    items: { type: 'string', description: 'Assignee username' },
                  },
                },
              },
            },
            required: ['issue'],
          },
          metadata: {
            category: 'GitHub',
            tags: ['repository', 'issue', 'create'],
            requiresAuth: true,
            estimatedDuration: 2000,
          },
        });
      });
    });

    describe('github.add_comment reaction', () => {
      it('should have correct structure', () => {
        const {
          githubReactions,
        } = require('../../../src/services/services/github/reactions');

        const reaction = githubReactions.find(
          (r: any) => r.id === 'github.add_comment'
        );

        expect(reaction).toEqual({
          id: 'github.add_comment',
          name: 'Add GitHub Comment',
          description: 'Adds a comment to an existing issue or pull request',
          configSchema: expect.any(Object),
          outputSchema: {
            type: 'object',
            properties: {
              comment: {
                type: 'object',
                description: 'The created comment details',
                properties: {
                  id: { type: 'number', description: 'Comment ID' },
                  body: { type: 'string', description: 'Comment body' },
                  html_url: { type: 'string', description: 'Comment URL' },
                  user: {
                    type: 'object',
                    description: 'Comment author',
                    properties: {
                      login: { type: 'string', description: 'Username' },
                      id: { type: 'number', description: 'User ID' },
                    },
                  },
                  created_at: {
                    type: 'string',
                    description: 'Creation timestamp',
                  },
                },
              },
            },
            required: ['comment'],
          },
          metadata: {
            category: 'GitHub',
            tags: ['repository', 'comment', 'issue', 'pull-request'],
            requiresAuth: true,
            estimatedDuration: 1500,
          },
        });
      });
    });
  });
});
