import type { ReactionDefinition } from '../../../types/service';
import {
  gitlabCreateIssueSchema,
  gitlabAddCommentSchema,
  gitlabCreateMergeRequestSchema,
  gitlabSetProjectVisibilitySchema,
} from './schemas';

export const gitlabReactions: ReactionDefinition[] = [
  {
    id: 'gitlab.create_issue',
    name: 'Create GitLab Issue',
    description: 'Creates a new issue in the specified project',
    configSchema: gitlabCreateIssueSchema,
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
            description: { type: 'string', description: 'Issue description' },
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
            created_at: { type: 'string', description: 'Creation timestamp' },
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
  },
  {
    id: 'gitlab.add_comment',
    name: 'Add GitLab Comment',
    description: 'Adds a comment to an issue or merge request',
    configSchema: gitlabAddCommentSchema,
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
            created_at: { type: 'string', description: 'Creation timestamp' },
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
  },
  {
    id: 'gitlab.create_merge_request',
    name: 'Create GitLab Merge Request',
    description: 'Creates a new merge request in the specified project',
    configSchema: gitlabCreateMergeRequestSchema,
    outputSchema: {
      type: 'object',
      properties: {
        merge_request: {
          type: 'object',
          description: 'The created merge request details',
          properties: {
            id: { type: 'number', description: 'Merge request ID' },
            iid: { type: 'number', description: 'Internal merge request ID' },
            title: { type: 'string', description: 'Merge request title' },
            description: {
              type: 'string',
              description: 'Merge request description',
            },
            state: { type: 'string', description: 'Merge request state' },
            web_url: { type: 'string', description: 'Merge request web URL' },
            source_branch: { type: 'string', description: 'Source branch' },
            target_branch: { type: 'string', description: 'Target branch' },
            author: {
              type: 'object',
              description: 'Merge request author',
              properties: {
                id: { type: 'number', description: 'User ID' },
                name: { type: 'string', description: 'User name' },
                username: { type: 'string', description: 'Username' },
              },
            },
            assignees: {
              type: 'array',
              description: 'Merge request assignees',
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
            created_at: { type: 'string', description: 'Creation timestamp' },
          },
        },
      },
      required: ['merge_request'],
    },
    metadata: {
      category: 'GitLab',
      tags: ['repository', 'merge-request', 'create'],
      requiresAuth: true,
      estimatedDuration: 2500,
    },
  },
  {
    id: 'gitlab.set_project_visibility',
    name: 'Set GitLab Project Visibility',
    description: 'Changes the visibility level of a project',
    configSchema: gitlabSetProjectVisibilitySchema,
    outputSchema: {
      type: 'object',
      properties: {
        project: {
          type: 'object',
          description: 'The updated project details',
          properties: {
            id: { type: 'number', description: 'Project ID' },
            name: { type: 'string', description: 'Project name' },
            path: { type: 'string', description: 'Project path' },
            path_with_namespace: {
              type: 'string',
              description: 'Full project path',
            },
            visibility: {
              type: 'string',
              description: 'Project visibility level',
            },
            web_url: { type: 'string', description: 'Project web URL' },
            description: { type: 'string', description: 'Project description' },
            updated_at: {
              type: 'string',
              description: 'Last update timestamp',
            },
          },
        },
      },
      required: ['project'],
    },
    metadata: {
      category: 'GitLab',
      tags: ['project', 'visibility', 'settings'],
      requiresAuth: true,
      estimatedDuration: 1000,
    },
  },
];
