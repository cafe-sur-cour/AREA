import type { ReactionDefinition } from '../../../types/service';
import { githubCreateIssueSchema, githubAddCommentSchema } from './schemas';

export const githubReactions: ReactionDefinition[] = [
  {
    id: 'github.create_issue',
    name: 'Create GitHub Issue',
    description: 'Creates a new issue in the specified repository',
    configSchema: githubCreateIssueSchema,
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
  },
  {
    id: 'github.add_comment',
    name: 'Add GitHub Comment',
    description: 'Adds a comment to an existing issue or pull request',
    configSchema: githubAddCommentSchema,
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
            created_at: { type: 'string', description: 'Creation timestamp' },
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
  },
];
