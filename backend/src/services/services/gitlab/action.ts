import type { ActionDefinition } from '../../../types/service';
import {
  gitlabPushSchema,
  gitlabMergeRequestOpenedSchema,
  gitlabMergeRequestMergedSchema,
  gitlabIssueOpenedSchema,
} from './schemas';

export const gitlabActions: ActionDefinition[] = [
  {
    id: 'gitlab.push',
    name: 'GitLab Push',
    description: 'Triggers when a push event occurs on a selected repository',
    configSchema: gitlabPushSchema,
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
            web_url: { type: 'string', description: 'Project web URL' },
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
                  email: { type: 'string', description: 'Author email' },
                },
              },
              timestamp: { type: 'string', description: 'Commit timestamp' },
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
  },
  {
    id: 'gitlab.merge_request_opened',
    name: 'GitLab Merge Request Opened',
    description: 'Triggers when a new merge request is opened',
    configSchema: gitlabMergeRequestOpenedSchema,
    inputSchema: {
      type: 'object',
      properties: {
        object_attributes: {
          type: 'object',
          description: 'Merge request attributes',
          properties: {
            id: { type: 'number', description: 'Merge request ID' },
            iid: { type: 'number', description: 'Internal merge request ID' },
            title: { type: 'string', description: 'Merge request title' },
            description: {
              type: 'string',
              description: 'Merge request description',
            },
            state: { type: 'string', description: 'Merge request state' },
            target_branch: { type: 'string', description: 'Target branch' },
            source_branch: { type: 'string', description: 'Source branch' },
            web_url: { type: 'string', description: 'Merge request web URL' },
            author_id: { type: 'number', description: 'Author ID' },
            assignee_ids: {
              type: 'array',
              description: 'Assignee IDs',
              items: { type: 'number', description: 'Assignee ID' },
            },
            created_at: { type: 'string', description: 'Creation timestamp' },
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
            web_url: { type: 'string', description: 'Project web URL' },
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
  },
  {
    id: 'gitlab.merge_request_merged',
    name: 'GitLab Merge Request Merged',
    description: 'Triggers when a merge request is merged',
    configSchema: gitlabMergeRequestMergedSchema,
    inputSchema: {
      type: 'object',
      properties: {
        object_attributes: {
          type: 'object',
          description: 'Merge request attributes',
          properties: {
            id: { type: 'number', description: 'Merge request ID' },
            iid: { type: 'number', description: 'Internal merge request ID' },
            title: { type: 'string', description: 'Merge request title' },
            description: {
              type: 'string',
              description: 'Merge request description',
            },
            state: { type: 'string', description: 'Merge request state' },
            target_branch: { type: 'string', description: 'Target branch' },
            source_branch: { type: 'string', description: 'Source branch' },
            web_url: { type: 'string', description: 'Merge request web URL' },
            author_id: { type: 'number', description: 'Author ID' },
            assignee_ids: {
              type: 'array',
              description: 'Assignee IDs',
              items: { type: 'number', description: 'Assignee ID' },
            },
            merged_at: { type: 'string', description: 'Merge timestamp' },
            created_at: { type: 'string', description: 'Creation timestamp' },
            updated_at: {
              type: 'string',
              description: 'Last update timestamp',
            },
          },
        },
        user: {
          type: 'object',
          description: 'User who merged the merge request',
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
            web_url: { type: 'string', description: 'Project web URL' },
          },
        },
      },
      required: ['object_attributes', 'user', 'project'],
    },
    metadata: {
      category: 'GitLab',
      tags: ['repository', 'merge-request', 'merged'],
      requiresAuth: true,
      webhookPattern: 'Merge Request Hook',
    },
  },
  {
    id: 'gitlab.issue_opened',
    name: 'GitLab Issue Opened',
    description: 'Triggers when a new issue is opened',
    configSchema: gitlabIssueOpenedSchema,
    inputSchema: {
      type: 'object',
      properties: {
        object_attributes: {
          type: 'object',
          description: 'Issue attributes',
          properties: {
            id: { type: 'number', description: 'Issue ID' },
            iid: { type: 'number', description: 'Internal issue ID' },
            title: { type: 'string', description: 'Issue title' },
            description: { type: 'string', description: 'Issue description' },
            state: { type: 'string', description: 'Issue state' },
            web_url: { type: 'string', description: 'Issue web URL' },
            author_id: { type: 'number', description: 'Author ID' },
            assignee_ids: {
              type: 'array',
              description: 'Assignee IDs',
              items: { type: 'number', description: 'Assignee ID' },
            },
            created_at: { type: 'string', description: 'Creation timestamp' },
            updated_at: {
              type: 'string',
              description: 'Last update timestamp',
            },
            labels: {
              type: 'array',
              description: 'Issue labels',
              items: { type: 'string', description: 'Label name' },
            },
          },
        },
        user: {
          type: 'object',
          description: 'User who opened the issue',
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
            web_url: { type: 'string', description: 'Project web URL' },
          },
        },
      },
      required: ['object_attributes', 'user', 'project'],
    },
    metadata: {
      category: 'GitLab',
      tags: ['repository', 'issue', 'opened'],
      requiresAuth: true,
      webhookPattern: 'Issue Hook',
    },
  },
];
