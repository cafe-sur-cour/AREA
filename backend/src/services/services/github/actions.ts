import type { ActionDefinition } from '../../../types/service';
import {
  githubPushSchema,
  githubPullRequestOpenedSchema,
  githubPullRequestMergedSchema,
} from './schemas';

export const githubActions: ActionDefinition[] = [
  {
    id: 'github.push',
    name: 'GitHub Push',
    description: 'Triggers when a push event occurs on a selected repository',
    configSchema: githubPushSchema,
    inputSchema: {
      type: 'object',
      properties: {
        repository: {
          type: 'object',
          description: 'Repository information',
          properties: {
            full_name: {
              type: 'string',
              description: 'Full repository name (owner/repo)',
            },
            name: { type: 'string', description: 'Repository name' },
            owner: {
              type: 'object',
              description: 'Repository owner information',
              properties: {
                login: { type: 'string', description: 'Owner username' },
                id: { type: 'number', description: 'Owner ID' },
              },
            },
          },
        },
        ref: { type: 'string', description: 'Git reference (branch/tag)' },
        before: { type: 'string', description: 'SHA before the push' },
        after: { type: 'string', description: 'SHA after the push' },
        commits: {
          type: 'array',
          description: 'List of commits in the push',
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
                  email: { type: 'string', description: 'Author email' },
                },
              },
            },
          },
        },
        pusher: {
          type: 'object',
          description: 'Pusher information',
          properties: {
            name: { type: 'string', description: 'Pusher username' },
            email: { type: 'string', description: 'Pusher email' },
          },
        },
      },
      required: ['repository', 'ref', 'before', 'after'],
    },
    metadata: {
      category: 'GitHub',
      tags: ['repository', 'push', 'git'],
      requiresAuth: true,
      webhookPattern: 'push',
    },
  },
  {
    id: 'github.pull_request.opened',
    name: 'GitHub Pull Request Opened',
    description: 'Triggers when a new pull request is opened',
    configSchema: githubPullRequestOpenedSchema,
    inputSchema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          description: 'The action that was performed (opened)',
        },
        number: { type: 'number', description: 'Pull request number' },
        pull_request: {
          type: 'object',
          description: 'Pull request details',
          properties: {
            id: { type: 'number', description: 'Pull request ID' },
            number: { type: 'number', description: 'Pull request number' },
            title: { type: 'string', description: 'Pull request title' },
            body: { type: 'string', description: 'Pull request body' },
            state: { type: 'string', description: 'Pull request state' },
            merged: { type: 'boolean', description: 'Whether PR is merged' },
            user: {
              type: 'object',
              description: 'User who created the PR',
              properties: {
                login: { type: 'string', description: 'Username' },
                id: { type: 'number', description: 'User ID' },
              },
            },
            head: {
              type: 'object',
              description: 'Head branch information',
              properties: {
                ref: { type: 'string', description: 'Branch name' },
                sha: { type: 'string', description: 'Commit SHA' },
                repo: {
                  type: 'object',
                  description: 'Head repository information',
                  properties: {
                    full_name: {
                      type: 'string',
                      description: 'Full repository name',
                    },
                  },
                },
              },
            },
            base: {
              type: 'object',
              description: 'Base branch information',
              properties: {
                ref: { type: 'string', description: 'Branch name' },
                sha: { type: 'string', description: 'Commit SHA' },
              },
            },
          },
        },
        repository: {
          type: 'object',
          description: 'Repository information',
          properties: {
            full_name: {
              type: 'string',
              description: 'Full repository name (owner/repo)',
            },
            name: { type: 'string', description: 'Repository name' },
            owner: {
              type: 'object',
              description: 'Repository owner information',
              properties: {
                login: { type: 'string', description: 'Owner username' },
                id: { type: 'number', description: 'Owner ID' },
              },
            },
          },
        },
      },
      required: ['action', 'number', 'pull_request', 'repository'],
    },
    metadata: {
      category: 'GitHub',
      tags: ['repository', 'pull-request', 'opened'],
      requiresAuth: true,
      webhookPattern: 'pull_request',
    },
  },
  {
    id: 'github.pull_request.merged',
    name: 'GitHub Pull Request Merged',
    description: 'Triggers when a pull request is merged',
    configSchema: githubPullRequestMergedSchema,
    inputSchema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          description: 'The action that was performed (closed)',
        },
        number: { type: 'number', description: 'Pull request number' },
        pull_request: {
          type: 'object',
          description: 'Pull request details',
          properties: {
            id: { type: 'number', description: 'Pull request ID' },
            number: { type: 'number', description: 'Pull request number' },
            title: { type: 'string', description: 'Pull request title' },
            body: { type: 'string', description: 'Pull request body' },
            state: { type: 'string', description: 'Pull request state' },
            merged: { type: 'boolean', description: 'Whether PR is merged' },
            merged_at: { type: 'string', description: 'When PR was merged' },
            user: {
              type: 'object',
              description: 'User who created the PR',
              properties: {
                login: { type: 'string', description: 'Username' },
                id: { type: 'number', description: 'User ID' },
              },
            },
            head: {
              type: 'object',
              description: 'Head branch information',
              properties: {
                ref: { type: 'string', description: 'Branch name' },
                sha: { type: 'string', description: 'Commit SHA' },
              },
            },
            base: {
              type: 'object',
              description: 'Base branch information',
              properties: {
                ref: { type: 'string', description: 'Branch name' },
                sha: { type: 'string', description: 'Commit SHA' },
              },
            },
          },
        },
        repository: {
          type: 'object',
          description: 'Repository information',
          properties: {
            full_name: {
              type: 'string',
              description: 'Full repository name (owner/repo)',
            },
            name: { type: 'string', description: 'Repository name' },
            owner: {
              type: 'object',
              description: 'Repository owner information',
              properties: {
                login: { type: 'string', description: 'Owner username' },
                id: { type: 'number', description: 'Owner ID' },
              },
            },
          },
        },
      },
      required: ['action', 'number', 'pull_request', 'repository'],
    },
    metadata: {
      category: 'GitHub',
      tags: ['repository', 'pull-request', 'merged'],
      requiresAuth: true,
      webhookPattern: 'pull_request',
    },
  },
];
